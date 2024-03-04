import axios from "axios";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import moment from "moment";
import { parseString } from "xml2js";
import dgram from "dgram";

// Tu código usando dgram aquí

dotenv.config();

// Constantes
const apiid = process.env.APPID;
const secretKey = process.env.SECRETKEY;
const url = process.env.URLASSISTCARGO;
const password = process.env.PASSWORD;
const userId = process.env.USUARIOASSISTCARGO;
const account = "globaltracker";
const apiUrl = process.env.APIURL;
const ipMdlz = process.env.IPMDLZ;
const puertoMdlz = process.env.PORTMDLZ;

// Variables globales
let accessToken = null;
let tokenRecursoSeguro = null;
let imei = ["013227000017073", "866551039964270"];

// Funciones

// Autenticación WanWay
function obtenerTokenWanWay() {
  const currentTimeUnix = Math.floor(new Date().getTime() / 1000);
  const signatureString = CryptoJS.MD5(secretKey) + currentTimeUnix;
  const twiceEncrypt = CryptoJS.MD5(signatureString).toString();

  const datos = {
    appid: apiid,
    time: currentTimeUnix,
    signature: twiceEncrypt,
  };

  axios
    .post(`${apiUrl}/auth`, datos)
    .then((response) => {
      accessToken = response.data.accessToken;
      console.log("Token WanWay obtenido:", accessToken);
    })
    .catch((error) => {
      console.error("Error en la autenticación WanWay:", error);
    });
}

// Autenticación Recurso Seguro
function obtenerTokenRecursoSeguro() {
  const xmlData = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns:tem="http://tempuri.org/">
      <soapenv:Header/>
      <soapenv:Body>
        <tem:GetUserToken>
          <tem:userId>${userId}</tem:userId>
          <tem:password>${password}</tem:password>
        </tem:GetUserToken>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

  const config = {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `http://tempuri.org/IRCService/GetUserToken`,
    },
  };

  axios
    .post(url, xmlData, config)
    .then((response) => {
      parseString(response.data, { explicitArray: false }, (err, result) => {
        if (err) {
          console.error("Error al analizar la respuesta XML:", err);
        } else {
          const aTokenValue =
            result?.["s:Envelope"]?.["s:Body"]?.GetUserTokenResponse
              ?.GetUserTokenResult?.["a:token"];

          if (aTokenValue) {
            tokenRecursoSeguro = aTokenValue;
            console.log("Token Recurso Seguro obtenido:", tokenRecursoSeguro);
          } else {
            console.error("No se pudo encontrar 'a:token' en la respuesta.");
          }
        }
      });
    })
    .catch((error) => {
      console.error("Error en la autenticación Recurso Seguro:", error);
    });
}

// Envío de posiciones
function sendPositions(data) {
  function date(unixTimestamp) {
    const momentObject = moment.unix(unixTimestamp);
    return momentObject.format("YYYY-MM-DDTHH:mm:ss");
  }

  data.data.forEach((position) => {
    const fecha = date(position.gpsTime);
    const xmlData = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:tem="http://tempuri.org/"
        xmlns:iron="http://schemas.datacontract.org/2004/07/IronTracking">
        <soapenv:Header/>
        <soapenv:Body>
          <tem:GPSAssetTracking>
            <tem:token>${tokenRecursoSeguro}</tem:token>
            <tem:events>
              <iron:Event>
              <iron:altitude>0</iron:altitude>
<iron:asset>${position.licenseNumber}</iron:asset>
<iron:battery>0</iron:battery>
<iron:code>1</iron:code>
<iron:course>0</iron:course>
<iron:customer>
<iron:id>0</iron:id>
<iron:name>${position.userName}</iron:name>
</iron:customer>
<iron:date>${fecha}</iron:date>
<iron:direction>0</iron:direction>
<iron:humidity>0</iron:humidity>
<iron:ignition>${position.accStatus}</iron:ignition>
<iron:latitude>${position.lat}</iron:latitude>
<iron:longitude>${position.lng}</iron:longitude>
<iron:odometer/>
<iron:serialNumber>1</iron:serialNumber>
<iron:shipment/>
<iron:speed>${position.speed}</iron:speed>
<iron:temperature></iron:temperature>
              </iron:Event>
            </tem:events>
          </tem:GPSAssetTracking>
        </soapenv:Body>
      </soapenv:Envelope>`;

    // Enviar la posición
    axios
      .post(url, xmlData, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: `http://tempuri.org/IRCService/GPSAssetTracking`,
        },
      })
      .then((response) => {
        console.log("Posición enviada con éxito. Estado:", response.status);
      })
      .catch((error) => {
        console.error("Error al enviar la posición:", error);
      });
  });
}
function sendMondelez(data) {
  function fecha(data) {
    const date = data.gpsTime;
    const fecha = moment(date).format("DDMMYYHHmmss").padStart(12, "0");
    return fecha;
  }

  data.data.forEach((position) => {
    const velocidad = position.speed.toString().padStart(3, "0");
    const curso = position.course.toString().padStart(3, "0");
    const mensaje = `${position.licenseNumber}${position.lat}${
      position.lng
    }${fecha(position)}${velocidad}${curso}3A`;

    const clienteUDP = dgram.createSocket("udp4");

    // Dirección y puerto del servidor UDP
    const puertoServidor = puertoMdlz;
    const direccionServidor = ipMdlz; // Cambia esto según la dirección de tu servidor

    // Convertir el mensaje a Buffer y enviarlo
    const bufferMensaje = Buffer.from(mensaje);
    clienteUDP.send(
      bufferMensaje,
      puertoServidor,
      direccionServidor,
      (error) => {
        if (error) {
          console.error("Error al enviar mensaje por UDP:", error);
        } else {
          console.log("Mensaje enviado con éxito por UDP: ", mensaje);
        }

        // Cerrar el cliente UDP después de enviar el mensaje
        clienteUDP.close();
      }
    );
  });
}
function kmsRecorridos(imei) {
  const unixTimestamp = Math.floor(new Date().getTime() / 1000);
  const startTime = unixTimestamp - 30;
  array.forEach((imei) => {
    const dirConsulta = `${apiUrl}/device/miles?accessToken=${accessToken}&startTime=${startTime}&endTime=${unixTimestamp}&imei=${imei}`;

    axios
      .get(dirConsulta)
      .then((response) => {
        const kmData = response.data;
        // Agrega aquí la lógica para trabajar con los datos si es necesario
        console.log("Datos de kilómetros recorridos:", kmData);
      })
      .catch((error) => {
        console.error("Error en la consulta de kilómetros recorridos:", error);
      });
  });
}
// Consulta de posiciones
function consultaPosiciones() {
  const dirConsulta = `${apiUrl}/device/status?accessToken=${accessToken}&imei=${imei}&account=${account}`;
  axios
    .get(dirConsulta)
    .then((response) => {
      const positionsData = response.data;

      // Llamar a la función para enviar las posiciones
      sendPositions(positionsData);
      sendMondelez(positionsData);
      kmsRecorridos();
    })
    .catch((error) => {
      console.error("Error en la solicitud de estado del dispositivo:", error);
    });
}

// ...

// ...

// Función principal
function main() {
  obtenerTokenWanWay();
  obtenerTokenRecursoSeguro();
  // Programar actualizaciones periódicas
  setInterval(obtenerTokenWanWay, 7200000); // Cada 2 horas
  setInterval(obtenerTokenRecursoSeguro, 86400000); // Cada 24 horas
  setInterval(consultaPosiciones, 30000); // Cada 30 segundos
}
main();

import axios from "axios";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import moment from "moment";
import { parseString } from "xml2js";

dotenv.config();

const apiid = process.env.APPID;
const secretKey = process.env.SECRETKEY;
const url = process.env.URLASSISTCARGO;
const password = process.env.PASSWORD;
const userId = process.env.USUARIOASSISTCARGO;
let datos = {};
let accessToken = null;
let tokenRecursoSeguro = null;
let account = "Romanesco";
let imei = [];
imei = ["013227000017073", "866551039964270"];
const currentTimeUnix = Math.floor(new Date().getTime() / 1000);

// Build the string used to calculate the signature
const signatureString = CryptoJS.MD5(secretKey) + currentTimeUnix;
const twiceEncrypt = CryptoJS.MD5(signatureString).toString();

// Assign MD5 signature and current time to data
datos.appid = apiid;
datos.time = currentTimeUnix;
datos.signature = twiceEncrypt;

console.log(datos);

const apiUrl = process.env.APIURL; // Replace with the actual API URL

function obtenerTokenWanWay() {
  console.log("Obteniendo Token");
  axios
    .post(`${apiUrl}/auth`, datos)
    .then((response) => {
      console.log("Successful response:");
      console.log(response.data);
      accessToken = response.data.accessToken; // Assign accessToken here
      console.log(accessToken);
    })
    .catch((error) => {
      console.error("Error in authentication request:", error);
    });
}
function sendData(data) {
  const config = {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `http://tempuri.org/IRCService/GPSAssetTracking`, // Reemplaza con el valor correcto
    },
  };

  axios
    .post(url, data, config)
    .then((response) => {
      console.log(response.status);
    })
    .catch((error) => {
      console.error(error);
    });
}

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
      SOAPAction: `http://tempuri.org/IRCService/GetUserToken`, // Reemplaza con el valor correcto
    },
  };

  axios
    .post(url, xmlData, config)
    .then((response) => {
      return new Promise((resolve, reject) => {
        parseString(response.data, { explicitArray: false }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            const aTokenValue =
              result?.["s:Envelope"]?.["s:Body"]?.GetUserTokenResponse
                ?.GetUserTokenResult?.["a:token"];

            if (aTokenValue) {
              tokenRecursoSeguro = aTokenValue; // Corrige aquí
              console.log("Token recurso Seguro: " + tokenRecursoSeguro);
              resolve(tokenRecursoSeguro);
            } else {
              reject("No se pudo encontrar 'a:token' en la respuesta.");
            }
          }
        });
      });
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}
function sendPositions(data) {
  // Iterar sobre cada posición y construir el XML correspondiente
  function date(unixTimestamp) {
    // Convertir el timestamp Unix a objeto moment
    const momentObject = moment.unix(unixTimestamp);

    // Formatear la fecha y hora según tu especificación
    const formattedDateTime = momentObject.format("YYYY-MM-DDTHH:mm:ss");

    return formattedDateTime;
  }

  data.data.forEach((position) => {
    const fecha = date(position.gpsTime);
    const xmlData = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:tem="http://tempuri.org/"
        xmlns:iron="http://schemas.datacontract.org/2004/07/IronTracking">
        <soapenv:Header/>
        <soapenv:Body>
          <tem:GPSAssetTracking>
            <tem:token>${tokenRecursoSeguro}</tem:token>
            <tem:events>
              <iron:Event>
                <iron:altitude></iron:altitude>
                <iron:asset>${position.licenseNumber}</iron:asset>
                <iron:battery></iron:battery>
                <iron:code>${position.code}</iron:code>
                <iron:course>${position.course}</iron:course>
                <iron:customer>
                  <iron:id></iron:id>
                  <iron:name></iron:name>
                </iron:customer>
                <iron:date>${fecha}</iron:date>
                <iron:direction>0</iron:direction>
                <iron:humidity>0</iron:humidity>
                <iron:ignition>0</iron:ignition>
                <iron:latitude>${position.lat}</iron:latitude>
                <iron:longitude>${position.lng}</iron:longitude>
                <iron:odometer/>
                <iron:serialNumber></iron:serialNumber>
                <iron:shipment/>
                <iron:speed>${position.speed}</iron:speed>
                <iron:temperature></iron:temperature>
              </iron:Event>
            </tem:events>
          </tem:GPSAssetTracking>
        </soapenv:Body>
      </soapenv:Envelope>
    `;

    // Enviar la posición
    sendData(xmlData);
  });
}
function consultaPosiciones() {
  console.log(`Token ${accessToken} Cuenta:${account}`);
  const dirConsulta = `${apiUrl}/device/status?accessToken=${accessToken}&imei=${imei}&account=${account}`;
  axios
    .get(dirConsulta)
    .then((response) => {
      const positionsData = response.data;
      console.log(positionsData);

      // Llamar a la función para enviar las posiciones
      sendPositions(positionsData);
    })
    .catch((error) => {
      console.error("Error in device status request:", error);
    });
}

obtenerTokenWanWay();
obtenerTokenRecursoSeguro();
setInterval(obtenerTokenWanWay, 7200000);
setInterval(obtenerTokenRecursoSeguro, 86400000);
setInterval(consultaPosiciones, 30000);

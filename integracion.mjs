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

const apiUrl = process.env.APIURL; // Reemplaza con el valor correcto
const account = "Romanesco";
const imei = ["013227000017073", "866551039964270"];

async function getTokenWanWay() {
  try {
    const currentTimeUnix = Math.floor(new Date().getTime() / 1000);
    const signatureString = CryptoJS.MD5(secretKey) + currentTimeUnix;
    const twiceEncrypt = CryptoJS.MD5(signatureString).toString();

    const datos = {
      appid: apiid,
      time: currentTimeUnix,
      signature: twiceEncrypt
    };

    console.log(datos);

    const response = await axios.post(`${apiUrl}/auth`, datos);
    const accessToken = response.data.accessToken;
    console.log("Token obtenido:", accessToken);
    return accessToken;
  } catch (error) {
    console.error("Error en la solicitud de autenticación:", error);
    throw error;
  }
}

async function getTokenRecursoSeguro() {
  try {
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
        SOAPAction: `http://tempuri.org/IRCService/GetUserToken`
      }
    };

    const response = await axios.post(url, xmlData, config);
    const tokenRecursoSeguro = response.data["s:Envelope"]["s:Body"]["GetUserTokenResponse"]["GetUserTokenResult"]["a:token"];
    
    console.log("Token recurso Seguro:", tokenRecursoSeguro);
    return tokenRecursoSeguro;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function formatDateTime(unixTimestamp) {
  const momentObject = moment.unix(unixTimestamp);
  return momentObject.format("YYYY-MM-DDTHH:mm:ss");
}

function buildXmlData(position, tokenRecursoSeguro) {
  const fecha = formatDateTime(position.gpsTime);
  return `
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
}

async function sendPositions(positionsData, tokenRecursoSeguro) {
  try {
    for (const position of positionsData.data) {
      const xmlData = buildXmlData(position, tokenRecursoSeguro);
      await sendData(xmlData);
    }
  } catch (error) {
    console.error(error);
  }
}

async function sendData(data) {
  try {
    const config = {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: `http://tempuri.org/IRCService/GPSAssetTracking`
      }
    };

    const response = await axios.post(url, data, config);
    console.log("Estado de la respuesta:", response.status);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function consultaPosiciones(accessToken) {
  try {
    console.log(`Token ${accessToken} Cuenta:${account}`);
    const dirConsulta = `${apiUrl}/device/status?accessToken=${accessToken}&imei=${imei}&account=${account}`;
    const response = await axios.get(dirConsulta);
    const positionsData = response.data;

    console.log(positionsData);
    await sendPositions(positionsData, accessToken);
  } catch (error) {
    console.error("Error en la solicitud de estado del dispositivo:", error);
  }
}

async function main() {
  try {
    const accessToken = await getTokenWanWay();
    const tokenRecursoSeguro = await getTokenRecursoSeg
  }}
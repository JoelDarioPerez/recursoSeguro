import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto-js";
import { response } from "express";

dotenv.config();

const userId = process.env.USUARIO;
const secretKey = process.env.SECRETKEY;
const apiUrl = process.env.APIURL;

const currentPage = 1;
const pageSize = 10;
const accountId = "10226571";
const deviceImei = "866551039964270";

const accessToken = await obtenerToken();

async function getUserTree() {
  try {
    const token = await obtenerToken();

    const response = await axios.get(`${apiUrl}/account/tree`, {
      params: {
        accessToken: token,
      },
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error getting user information:", error.message);
    throw error;
  }
}
getUserTree();
async function getDeviceListByUser() {
  try {
    const response = await axios.get(`${apiUrl}/device`, {
      params: {
        accessToken: accessToken,
        id: 10226571,
        currentPage: currentPage,
        pageSize: pageSize,
        needCount: true,
      },
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error getting device information:", error.message);
    throw error;
  }
}

getDeviceListByUser();
async function queryDeviceStatus() {
  try {
    const response = await axios.get(`${apiUrl}/device/status`, {
      params: {
        accessToken: accessToken,
        imei: "",
        account: "Romanesco",
      },
    });

    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error("Error getting device status:", error.message);
    throw error;
  }
}

queryDeviceStatus()
  .then((deviceStatus) => {
    console.log("Device Status:", deviceStatus);

    if (deviceStatus.data && deviceStatus.data.length > 0) {
      const workModeData = deviceStatus.data[0].workMode;
      console.log("WorkMode Data:", JSON.stringify(workModeData, null, 2));
    } else {
      console.log("No workMode data available.");
    }
  })
  .catch((error) => {
    console.error("Error getting device status:", error.message);
  });

function getRealTimeLocation() {
  const serviceUrl = `${apiUrl}/device/location`;
  const urlConsulta = `${serviceUrl}?accessToken=${accessToken}&imei=${"866551039964270"}`;

  return fetch(urlConsulta, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Request Error: ${response.statusText}`);
      }

      return response.json();
    })
    .then((locationInfo) => {
      console.log("Real-time device location information:", locationInfo);
      return locationInfo;
    })
    .catch((error) => {
      console.error("Error getting real-time device location:", error.message);
      throw error;
    });
}

getRealTimeLocation(accessToken, deviceImei)
  .then((locationInfo) => {
    // Handle real-time location information as needed
  })
  .catch((error) => {
    console.error("Error getting real-time device location:", error.message);
  });

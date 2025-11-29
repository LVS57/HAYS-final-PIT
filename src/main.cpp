#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define SS_PIN 5
#define RST_PIN 0
MFRC522 rfid(SS_PIN, RST_PIN);

WiFiMulti wifiMulti;

const char* mqttServer = "192.168.212.29";
const int mqttPort = 1883;
const char* mqttClientID = "ESP32_RFID";
const char* topicData = "rfid/data";
const char* topicRelay = "RFID_LOGIN";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

const char* serverScan = "http://192.168.212.29/insert.php";

String lastTag = "";
unsigned long lastReadTime = 0;
const unsigned long readInterval = 3000;
bool wifiConnected = false;

void connectToWiFi();
void reconnectMQTT();
void readRFID();
void sendRFIDData(const String& rfidTag);

void setup() {
  Serial.begin(115200);
  while (!Serial);

  SPI.begin(18, 19, 23);
  rfid.PCD_Init();
  Serial.println("RFID reader initialized");

  WiFi.mode(WIFI_STA);
  wifiMulti.addAP("Ew", "12345678"); 
  wifiMulti.addAP("V2042", "Singayan");
  wifiMulti.addAP("Cloud Control Network", "ccv7network");
  connectToWiFi();

  mqttClient.setServer(mqttServer, mqttPort);

  Serial.println("System ready. Scan RFID cards...");
  Serial.println();
}

void loop() {
  if (wifiMulti.run() != WL_CONNECTED) {
    if (wifiConnected) {
      wifiConnected = false;
      Serial.println("WiFi disconnected");
    }
    delay(2000);
    connectToWiFi();
    return;
  } else if (!wifiConnected) {
    wifiConnected = true;
    Serial.println("WiFi reconnected");
  }

  if (!mqttClient.connected()) reconnectMQTT();
  mqttClient.loop();

  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    readRFID();
  }

  delay(30);
}

void connectToWiFi() {
  int attempts = 0;
  while (wifiMulti.run() != WL_CONNECTED && attempts < 30) {
    Serial.print(".");
    delay(500);
    attempts++;
  }

  if (wifiMulti.run() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.println();
  } else {
    Serial.println("\nFailed to connect to WiFi");
    Serial.println();
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect(mqttClientID)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 2s");
      delay(2000);
    }
  }
}

void readRFID() {
  if (millis() - lastReadTime < readInterval) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  String tag = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    tag += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    tag += String(rfid.uid.uidByte[i], HEX);
  }
  tag.toUpperCase();
  lastReadTime = millis();

  Serial.print("RFID Detected: ");
  Serial.println(tag);

  sendRFIDData(tag);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void sendRFIDData(const String& rfidData) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Cannot send data - WiFi disconnected");
        return;
    }

    WiFiClient client;
    HTTPClient http;

    if (!http.begin(client, serverScan)) {
        Serial.println("HTTP begin failed");
        return;
    }

    http.addHeader("Content-Type", "application/json");
    String jsonPayload = "{\"rfid_data\":\"" + rfidData + "\"}";
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("Server response: ");
        Serial.println(response);

        DynamicJsonDocument doc(200);
        DeserializationError error = deserializeJson(doc, response);
        if (!error) {
            if (doc.containsKey("rfid_status")) {
                int rfidStatus = doc["rfid_status"];
                
                if (!mqttClient.connected()) reconnectMQTT();
                mqttClient.publish(topicData, rfidData.c_str());

                String statusMessage = (rfidStatus == 1) ? "1" : "0";
                mqttClient.publish(topicRelay, statusMessage.c_str());

                Serial.print("Published RFID status: ");
                Serial.println(statusMessage);
            } else {
                if (!mqttClient.connected()) reconnectMQTT();
                mqttClient.publish(topicData, rfidData.c_str());
                mqttClient.publish(topicRelay, "RFID NOT FOUND");

                Serial.println("Published: RFID NOT FOUND");
            }
        } else {
            Serial.println("JSON parse error");
            if (!mqttClient.connected()) reconnectMQTT();
            mqttClient.publish(topicData, rfidData.c_str());
            mqttClient.publish(topicRelay, "RFID NOT FOUND");
            Serial.println("Published: RFID NOT FOUND (parse error)");
        }
    } else {
        Serial.print("HTTP Error code: ");
        Serial.println(httpResponseCode);
        if (!mqttClient.connected()) reconnectMQTT();
        mqttClient.publish(topicData, rfidData.c_str());
        mqttClient.publish(topicRelay, "RFID NOT FOUND");
        Serial.println("Published: RFID NOT FOUND (HTTP error)");
    }

    http.end();
}

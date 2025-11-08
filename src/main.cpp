#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>


#define SS_PIN 5
#define RST_PIN 0

MFRC522 rfid(SS_PIN, RST_PIN);
WiFiMulti wifiMulti;


const char* serverScan = "http://10.10.10.33/insert.php";


void readRFID();
void sendScan(const String& rfidTag);
void connectToWiFi();


String lastTag = "";
unsigned long lastReadTime = 0;
const unsigned long readInterval = 1500;
bool wifiConnected = false;

void setup() {
  Serial.begin(115200);
  while (!Serial);

  
  SPI.begin(18, 19, 23);
  rfid.PCD_Init();
  Serial.println("RFID reader initialized");

  // Set WiFi mode and add networks
  WiFi.mode(WIFI_STA);
  wifiMulti.addAP("Cloud Control Network", "ccv7network"); 
  
  connectToWiFi();
  
  Serial.println("System ready. Scan RFID cards...");
  Serial.println();
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
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.println();
  } else {
    Serial.println("\nFailed to connect to WiFi");
    Serial.println();
  }
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

  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    readRFID();
  }
  delay(30);
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
  if (tag == lastTag) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }
   lastTag = tag;

  Serial.print("RFID Detected: ");
  Serial.println(tag);

  sendScan(tag);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void sendRFIDData(String rfidData) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send data - WiFi disconnected");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  if (!http.begin(client, serverScan)) return;

  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  String jsonPayload = "{\"rfid_data\":\"" + rfidData + "\"}";
  Serial.println("Attempting to send data to server...");
  Serial.print("JSON Payload: ");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.print("Server response: ");
    Serial.println(response);
    Serial.println();
  } else {
    Serial.print("Error sending data. Code: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}
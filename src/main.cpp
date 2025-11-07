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

  WiFi.mode(WIFI_STA);
  wifiMulti.addAP("Cloud Control Network", "ccv7network");

  connectToWiFi();
  Serial.println("System ready. Scan RFID cards...");
}

void connectToWiFi() {
  int attempts = 0;
  while (wifiMulti.run() != WL_CONNECTED && attempts < 30) {
    Serial.print('.');
    delay(500);
    attempts++;
  }
  if (wifiMulti.run() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi connected");
    Serial.print("IP: "); Serial.println(WiFi.localIP());
  } else {
    wifiConnected = false;
    Serial.println("\nWiFi not connected");
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

void sendScan(const String& rfidTag) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send scan - WiFi disconnected");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  Serial.print("POST "); Serial.println(serverScan);
  if (!http.begin(client, serverScan)) {
    Serial.println("HTTP begin failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  String payload = String("{\"rfid_data\":\"") + rfidTag + "\"}";
  int code = http.POST(payload);
  if (code > 0) {
    Serial.print("HTTP "); Serial.println(code);
    String resp = http.getString();
    Serial.println(resp);
  } else {
    Serial.print("HTTP error: "); Serial.println(code);
  }
  http.end();
}
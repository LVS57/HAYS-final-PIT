#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "V2042";
const char* password = "Singayan";
const char* mqttServer = "192.168.212.29"; 
const int mqttPort = 1883;

const int relayPin = 5; 

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* message, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)message[i];

  Serial.print("Received message: ");
  Serial.println(msg);

  if (msg == "1") {
    digitalWrite(relayPin, HIGH);
  } else if (msg == "0") {
    digitalWrite(relayPin, LOW);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32_RELAY")) {
      Serial.println("connected");
      client.subscribe("RFID_LOGIN");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 2s");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(relayPin, OUTPUT);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected");

  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}


@startuml
package Victims {
  class Victim {
    +id: UUID
    +name: String
    +subdomain: String
    +custom_domain: String
    +image_url: String
    +story: Text
  }
  Victim --> "1" VictimProfileAPIView : serves
  VictimProfileAPIView --> VictimSerializer : serializes
}
@enduml
// AUTO-GENERATED from protocol/protocol.json by protocol/generate.py — DO NOT EDIT.


export const PROTO_META = {
  baud: 115200,
  authTimeoutSecs: 300,
  rfidDebounceMs: 3000,
} as const;

export const FIREBASE_EVENTS = [
  "SYSTEM_READY",
  "RFID_SCAN",
  "AUTH_OK",
  "AUTH_FAIL",
  "AUTH_TIMEOUT",
  "SESSION_CLOSED",
  "MACHINE_SELECTED",
  "COMMAND_SENT",
  "VALVE_ANGLE_SENDING",
  "VALVE_ANGLE_SET",
  "VALVE_POSITION_SENDING",
  "VALVE_POSITION_SET",
  "PUMP_ON",
  "PUMP_OFF",
  "FAN_ON",
  "FAN_OFF",
  "EMERGENCY_STOP",
  "NACK",
] as const;
export type FirebaseEvent = (typeof FIREBASE_EVENTS)[number];

export const AUTH_EVENTS = [
  "AUTH_OK",
  "AUTH_FAIL",
  "AUTH_TIMEOUT",
  "SESSION_CLOSED",
] as const;

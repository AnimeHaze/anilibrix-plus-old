import { app } from 'electron';

export function applyAppSwitches () {
  app.commandLine.appendSwitch('--no-sandbox')
  app.commandLine.appendSwitch('disable-site-isolation-trials')
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
}

// Define elements once Home Assistant's element registry is the final one.
//
// Home Assistant installs a scoped custom-element registry polyfill at start-up; a
// module that runs before it would define its elements in a registry the app then
// replaces. Wait for <home-assistant> to be defined; outside Home Assistant (the
// bench) there is nothing to wait for. The fix comes from Raccolta 0.4.1 and Home
// Defender 1.0.12.
const ready: Promise<unknown> =
  document.querySelector("home-assistant") && !customElements.get("home-assistant")
    ? customElements.whenDefined("home-assistant")
    : Promise.resolve();

export function define(name: string, element: CustomElementConstructor): void {
  void ready.then(() => {
    if (!customElements.get(name)) customElements.define(name, element);
  });
}

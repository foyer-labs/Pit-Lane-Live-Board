// The cards' module (decision 47). Home Assistant loads it on every page (the
// integration adds it as an extra module), so the cards are in the card picker
// with no resource to add by hand. Separate from the panel's module: a dashboard
// with one card does not load the whole panel.
import { PlbAge, PlbCountdown } from "./clock";
import { define } from "./define";
import { PlbLiveMap } from "./pages/live-map";
import { CARDS } from "./cards/cards";
import { pageTranslator } from "./cards/base";

const DOCS = "https://github.com/foyer-labs/Pit-Lane-Live-Board/blob/main/docs/guide.md#dashboard-cards";

interface PickerEntry {
  type: string;
  name: string;
  description: string;
  preview: boolean;
  documentationURL: string;
}

// The names are translated when the card picker reads them, not when this module
// loads: it can run before Home Assistant has set the page's language from the
// user's profile.
const picker = ((window as unknown as { customCards?: PickerEntry[] }).customCards ??= []);
for (const card of CARDS) {
  define(card.tag, card.element);
  if (!picker.some((entry) => entry.type === card.tag)) {
    picker.push({
      type: card.tag,
      get name() {
        return `Pit Lane · ${pageTranslator()(`cards.${card.key}.name`)}`;
      },
      get description() {
        return pageTranslator()(`cards.${card.key}.description`);
      },
      preview: true,
      documentationURL: DOCS,
    });
  }
}
define("plb-live-map", PlbLiveMap);
define("plb-countdown", PlbCountdown);
define("plb-age", PlbAge);

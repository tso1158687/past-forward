import { HistoricalEvent } from '../../core/history/historical-event';
import { LocalizedText } from '../../core/i18n/localized-text';
import type { PlaceMarker } from '../../scene/layers/place-layer';

/** The places of an event as plain markers for the scene; none when no event is selected. */
export function toPlaceMarkers(
  event: HistoricalEvent | undefined,
  text: (value: LocalizedText) => string,
): PlaceMarker[] {
  if (!event) return [];
  return event.places.map((place, index) => ({
    id: `${event.id}-${index}`,
    label: text(place.name),
    location: place.location,
  }));
}

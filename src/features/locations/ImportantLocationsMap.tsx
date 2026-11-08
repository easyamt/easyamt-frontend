import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'
import type { ImportantLocation } from '../documents/api'
import 'leaflet/dist/leaflet.css'

type ResolvedLocation = ImportantLocation & {
  coordinates: { latitude: number; longitude: number }
}

function isResolved(location: ImportantLocation): location is ResolvedLocation {
  return location.geocoding_status === 'resolved'
    && location.coordinates !== null
    && Number.isFinite(location.coordinates.latitude)
    && Number.isFinite(location.coordinates.longitude)
    && location.coordinates.latitude >= -90
    && location.coordinates.latitude <= 90
    && location.coordinates.longitude >= -180
    && location.coordinates.longitude <= 180
}

function MapViewport({ locations }: { locations: ResolvedLocation[] }) {
  const map = useMap()

  useEffect(() => {
    if (locations.length === 1) {
      map.setView([locations[0].coordinates.latitude, locations[0].coordinates.longitude], 14)
      return
    }
    map.fitBounds(locations.map((location) => [location.coordinates.latitude, location.coordinates.longitude]), { padding: [32, 32], maxZoom: 14 })
  }, [locations, map])

  return null
}

const markerIcon = L.divIcon({
  className: 'location-marker',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function locationLabel(location: ImportantLocation): string {
  return [location.address, location.city, location.country].filter(Boolean).join(', ')
}

export default function ImportantLocationsMap({ locations }: { locations: ImportantLocation[] }) {
  const { t } = useTranslation()
  const resolved = useMemo(() => locations.filter(isResolved), [locations])
  const unresolved = locations.filter((location) => !isResolved(location))

  if (locations.length === 0) return null

  const first = resolved[0]
  const center: [number, number] = first
    ? [first.coordinates.latitude, first.coordinates.longitude]
    : [51.1657, 10.4515]

  return <section className="locations-section" aria-labelledby="important-locations-heading">
    <div className="section-heading">
      <p className="eyebrow">{t('locationsEyebrow')}</p>
      <h2 id="important-locations-heading">{t('importantLocations')}</h2>
    </div>
    <p className="locations-disclaimer">{t('locationsDisclaimer')}</p>
    {resolved.length > 0 && <div className="locations-layout">
      <MapContainer className="locations-map" center={center} zoom={resolved.length === 1 ? 14 : 6} scrollWheelZoom={false} aria-label={t('importantLocationsMap')}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewport locations={resolved} />
        {resolved.map((location) => <Marker key={location.id} position={[location.coordinates.latitude, location.coordinates.longitude]} icon={markerIcon}>
          <Popup>
            <strong>{location.name}</strong>
            {locationLabel(location) && <span className="map-popup-address">{locationLabel(location)}</span>}
          </Popup>
        </Marker>)}
      </MapContainer>
      <div className="locations-list">
        {resolved.map((location) => <article className="location-item" key={location.id}>
          <span className="location-number" aria-hidden="true">{resolved.indexOf(location) + 1}</span>
          <div><h3>{location.name}</h3>{locationLabel(location) && <p>{locationLabel(location)}</p>}{location.source_page && <small>{t('locationSource', { page: location.source_page })}</small>}</div>
        </article>)}
      </div>
    </div>}
    {resolved.length === 0 && <p className="locations-empty">{t('locationsNoCoordinates')}</p>}
    {unresolved.length > 0 && <div className="locations-unresolved">
      <strong>{t('locationsCheck')}</strong>
      {unresolved.map((location) => <p key={location.id}><span>{location.name}</span>{location.address ? ` · ${location.address}` : ` · ${t('locationNoAddress')}`}</p>)}
    </div>}
  </section>
}

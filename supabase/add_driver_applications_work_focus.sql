-- What the driver wants to do: inner-city parcel distribution vs B2B between cities.
alter table public.driver_applications
  add column if not exists work_focus text;

comment on column public.driver_applications.work_focus is
  'city_parcels = inner-city parcel distribution; b2b_intercity = B2B work outside / between cities';

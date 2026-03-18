-- تحويل أرقام السائقين الحالية إلى 5 أرقام (10001، 10002، ...)
-- تشغيل مرة واحدة بعد driver_applications_full و driver_stats_rating_suspend

update public.driver_applications
set driver_number = 10000 + driver_number
where driver_number is not null and driver_number < 10000;

-- Alias con espacios internos sencillos y letras españolas acentuadas.
-- Superconjunto de la regla anterior: ninguna fila existente puede fallar.
-- La estructura "palabras unidas por un espacio" prohíbe por construcción
-- espacios al inicio/fin y dobles espacios (aliases visualmente duplicados
-- pasarían el unique siendo strings distintos). La longitud 3-20 sigue en
-- profiles_alias_length.

alter table public.profiles
  drop constraint profiles_alias_format,
  add constraint profiles_alias_format
    check (alias ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_.-]+( [A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_.-]+)*$');

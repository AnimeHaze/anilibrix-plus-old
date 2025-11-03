# AniLibrix Plus

[![Канал обновлений](https://img.shields.io/badge/%D0%A2%D0%B5%D0%BB%D0%B5%D0%B3%D1%80%D0%B0%D0%BC_%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB-%D0%BE%D0%B1%D0%BD%D0%BE%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F-blue?style=for-the-badge&logo=telegram)](https://t.me/anilibrix_plus) [![Чат приложения](https://img.shields.io/badge/%D0%A2%D0%B5%D0%BB%D0%B5%D0%B3%D1%80%D0%B0%D0%BC-%D1%87%D0%B0%D1%82_%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F-blue?style=for-the-badge&logo=telegram&link=https%3A%2F%2Ft.me%2Fanilibrix_plus_chat
)](https://t.me/anilibrix_plus_chat)

### Десктопный аниме-кинотеатр Анилибрии для любого вашего компьютера.

![Anilibrix](https://raw.githubusercontent.com/AnimeHaze/anilibrix-plus/master/.github/assets/anilibrix.png)

### Особенности не официальной версии (этой):
*_Пункты с стрелочкой кликабельны_

*
  <details>
 >Просто вырезка лишнего фрагмента из описаний релиза


*
  <details>
#### АЛ (Анилибрия/Анилиберти) — так звучит аниме!

### Горячие клавиши плеера

| Клавиша | Действие                               |
|---------|----------------------------------------|
| F       | Переключение полноэкранного режима     |
| ←       | Назад                                  |
| →       | Вперед                                 |
| ↑       | Громкость больше (или колесиком мышки) |
| ↓       | Громкость меньше (или колесиком мышки) |
| space   | Воспроизведение / пауза                |

Плюс кастомные клавиши на свое усмотрение которые устанавливаются в настроках для:
- Включения выключени автопропуска опенинга не выходя из плеера
- Пропуска опенинга

### Сборка и запуск

> Требуемая верси Node.JS - **14.x.x**
> На других версиях (особенно выше) могут быть проблемы со сборкой нативных модулей
>
> Чертов сраный легаси проще переписать с нуля...

Перед запуском не забудьте скопировать и отредактировать пример `.env` файла:

``` bash
cp .env.example .env
```

``` bash
# Установка и сборка зависимостей
yarn install

# Запуск с горячей перезагрузкой на localhost:9080
yarn run serve

# Сборка production версии
yarn run build

# Запуск ESLint --fix для JS/Vue файлов и компонентов в `src/`
yarn run lint:fix

# Сборка под все платформы
yarn run release

# Сборка под MacOS
yarn run release:mac

# Сборка под Windows
yarn run release:win

# Сборка под Linux
yarn run release:lin
```

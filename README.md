# AniLibrix Plus

[![🇷🇺 Русский](https://img.shields.io/badge/%F0%9F%87%B7%F0%9F%87%BA-Russian-blue?style=for-the-badge)](#russian)
[![🇺🇸 English](https://img.shields.io/badge/%F0%9F%87%BA%F0%9F%87%B8-English-red?style=for-the-badge)](#english)

[![License](https://img.shields.io/badge/license-MIT%20License-blue.svg)](https://github.com/anilibria/alice/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/AnimeHaze/anilibrix-plus.svg)](https://github.com/AnimeHaze/anilibrix-plus/issues)

<div>
    <a href="https://anilibria.tv/">
        <img align="right" alt="" src="https://avatars.githubusercontent.com/u/43943370?s=200&v=4" width="200" height="200" />
    </a>
</div>

<a id="russian"></a>

## 🇷🇺 Русский

Десктопный аниме-кинотеатр Анилибрии для любого вашего компьютера.

[![Канал обновлений](https://img.shields.io/badge/%D0%A2%D0%B5%D0%BB%D0%B5%D0%B3%D1%80%D0%B0%D0%BC_%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB-%D0%BE%D0%B1%D0%BD%D0%BE%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F-blue?style=for-the-badge&logo=telegram)](https://t.me/anilibrix_plus) [![Чат приложения](https://img.shields.io/badge/%D0%A2%D0%B5%D0%BB%D0%B5%D0%B3%D1%80%D0%B0%D0%BC-%D1%87%D0%B0%D1%82_%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F-blue?style=for-the-badge&logo=telegram&link=https%3A%2F%2Ft.me%2Fanilibrix_plus_chat)](https://t.me/anilibrix_plus_chat)

[![Загрузите из Snap Store](https://snapcraft.io/static/images/badges/ru/snap-store-black.svg)](https://snapcraft.io/anilibrix-plus)

![Anilibrix](https://raw.githubusercontent.com/AnimeHaze/anilibrix-plus/lord/.github/assets/anilibrix.png)

### Сравнение возможностей: Anilibria (официальный) vs Anilibrix Plus

| Особенность / Функция | AnilibriX (официальный) | AnilibriX Plus (неофициальный форк) |
| :--- | :--- | :--- |
| **Авторизация** | Только стандартная (логин/пароль) | ✅ **Вход через ВКонтакте** <br> <details><summary>Скриншот</summary>![Вход через ВКонтакте](./assets/img.png)</details> |
| **Управление плеером** | Нет пропуска опенинга / эндинга | ✅ **Авто-пропуск опенинга** <br>✅ **Ручной пропуск в один клик** <br>✅ **Ручной пропуск горячей клавишей** <details><summary>Скриншоты</summary>![Кнопка пропуска](./assets/opening-skip.png)![Настройки пропуска](./assets/opening-skip2.png)</details> |
| **Синхронизация** | История хранится локально и не синхронизируется | ✅ **Резервное копирование и восстановление** данных просмотра (привязка к аккаунту) через сторонний сервер <br> <details><summary>Скриншот</summary>![Резервные копии](./assets/snaps.png)</details> |
| **Случайный релиз** | Нет случайного релиза | ✅ **Кнопка случайного релиза** <br> <details><summary>Скриншот</summary>![Случайный релиз](./assets/rand.png)</details> |
| **Интеграции** | Нет | ✅ **Discord Rich Presence** (отображение статуса просмотра) <br> Показывает иконку приложения, постер и информацию о просматриваемом релизе: номер текущей серии, общее количество серий, название, ссылка на релиз, ссылка на сайт Anilibria, сколько осталось времени до конца серии <br> <details><summary>Скриншот</summary>![Discord RPC](./assets/drpc.png)</details> |
| **Сеть и доступ** | Один сервер | ✅ **Смена API и сервера статики** (кастомный эндпоинт, выбор из списка, ручной ввод) <br> <details><summary>Скриншот</summary>![Выбор эндпоинта](./assets/endpoint.png)</details> ✅ **Усиленный резистенс к блокировкам** <br> ✅ **Агрессивный локальный кеш** <br> ✅ **Работа при частичном отсутствии сети** <br> ✅ **Поддержка прокси** (флаг `--proxy-server=http://127.0.0.1:8008` и опция в настройках)<br>✅ **Встроенная Opera VPN** <br> <details><summary>Скриншот OperaProxy</summary>![OperaProxy](./assets/operaproxy.png)</details> |
| **Интерфейс (UI/UX)** | Положение кнопок системного бара фиксировано для типа системы. <br> Кнопка вверх отсутствует | ✅ **Возможность форсированно переместить кнопки окна вправо** <br> <details><summary>Скриншот</summary>![Кнопки окна](./assets/win_buttons.png)</details> <br>✅ **Кнопка «ВВЕРХ»** <br> <details><summary>Скриншот</summary>![Кнопка вверх](./assets/up.png)</details> <br>✅ **Кнопки навигации (назад/вперед)** <br>✅ **Кнопка «Поделиться»** на странице релиза |
| **Карточка релиза** | Стандартная | ✅ **Связанные релизы (франшизы)** <details><summary>Скриншот</summary>![Связанные релизы](./assets/fran.png)</details> ✅ **Вывод дат выхода эпизодов и их названий** <details><summary>Скриншот</summary>![Даты эпизодов](./assets/dates.png)</details> ✅ **Список людей, работавших над релизом (команда)** <details><summary>Скриншот</summary>![Команда релиза](./assets/team.png)</details> ✅ **Убран круглый постер** в пользу полного <details><summary>Скриншот</summary>![Полный постер](./assets/poster.png)</details> |
| **Избранное** | Стандартный список | ✅ **Сортировка по популярности** <br> <details><summary>Скриншот</summary>![Сортировка по популярности](./assets/fav_pop.png)</details> <br>✅ **Отображение статуса релиза** в карточке <br> <details><summary>Скриншот</summary>![Статус в избранном](./assets/status.png)</details> <br>✅ **Постоянный вывод прогресса с цветовой индикацией** <br> <details><summary>Скриншот</summary>![Прогресс цветом](./assets/fav_progress.png)</details> <br>✅ **Фильтр уведомлений** (только по избранному) <br> <details><summary>Скриншот</summary>![Фильтр уведомлений](./assets/notify_fav.png)</details> <br>✅ **Вывод количества у пользователей в избранном** (рейтинг) <br> <details><summary>Скриншоты</summary>![Рейтинг в избранном](./assets/fav_rating.png)![Рейтинг везде](./assets/last_rating.png)</details> <br>✅ **Фильтр по статусам** ("все статусы", "все кроме в работе") <br>✅ **Вывод количества серий в сезоне** (если известно) <br>✅ **Контекстное меню для быстрой отметки просмотра серий без захода в релиз** |
| **Торренты** | Нет списка, воспроизведение торрентов сломано | ✅ **Вывод списка торрентов** с возможностью открыть во внешнем клиенте, скачать файл и скопировать magnet <br> <details><summary>Скриншот</summary>![Список торрентов](./assets/torrents.png)</details> |
| **Системное** | Стандартное | ✅ **Показ файла конфига** в настройках (в нем хранится вся история и прогресс) <br> <details><summary>Скриншот</summary>![Показать конфиг](./assets/showconfig.png)</details> <br>✅ **Кеш постеров и статики** <br>✅ **Сохранение состояния окна** (положение, полноэкранный режим) <br>✅ Прогресс и данные **не удаляются при деинсталляции** |
| **Платформы** | Windows, Linux, macOS (x64) | ✅ **Наличие Flatpak / RPM / DEB пакетов** <br> ✅ **Версия для ARM (macOS)** без Rosetta 2 <br>✅ Linux-пакет с категорией `AudioVideo;Video;Player;` |
| **Поддержка контента** | Только видео с серверов Anilibria | ✅ **Поддержка Anilibria Rutube-релизов** в плеере (пометка RUTUBE в сериях) |
| **Исправления и улучшения** | - | ✅ Исправлен баг с прогрессом (у релизов, где серии начинаются не с 1)<br>✅ Исправлено засыпание компьютера и выключение экрана при просмотре<br>✅ Исправлен баг с автовоспроизведением (0 эпизод)<br>✅ Меньше вылетов из аккаунта (повторная авторизация автоматически)<br>✅ Регулировка громкости (20 делений вместо 10)<br>✅ Фикс запуска при поврежденном конфиге (ранее приложение переставало запускаться)<br>✅ Исправлено пропадание из избранного релизов-анонсов<br>✅ Picture-in-picture теперь не сбрасывается при переключении серий |

#### Анилибрия — так звучит аниме!

### Горячие клавиши плеера

| Клавиша | Действие |
|---------|----------|
| F | Переключение полноэкранного режима |
| ← | Назад |
| → | Вперед |
| ↑ | Громкость больше (или колесиком мышки) |
| ↓ | Громкость меньше (или колесиком мышки) |
| space | Воспроизведение / пауза |

Плюс кастомные клавиши на свое усмотрение, которые устанавливаются в настройках для:

- Включения и выключения автопропуска опенинга без выхода из плеера
- Пропуска опенинга

---

### Сборка и запуск

<details>
<summary>🔧 Инструкция для разработчиков (нажмите для раскрытия)</summary>

> **Требуемая версия Node.JS - 14.x.x**  
> На других версиях, особенно выше, могут быть проблемы со сборкой нативных модулей.

Перед запуском не забудьте скопировать и отредактировать пример файла `.env`:

```bash
cp .env.example .env
```

```bash
# Установка и сборка зависимостей
yarn install

# Запуск с горячей перезагрузкой на localhost:9080
yarn run serve

# Сборка production-версии
yarn run build

# Запуск ESLint --fix для JS/Vue файлов и компонентов в `src/`
yarn run lint:fix

# Сборка под все платформы
yarn run release

# Сборка под macOS
yarn run release:mac

# Сборка под Windows
yarn run release:win

# Сборка под Linux
yarn run release:lin
```

</details>

---

#### Перевод на английский: [TomerGamerTV](https://github.com/TomerGamerTV) 😉

---

<a id="english"></a>

## 🇺🇸 English

AniLibria's desktop anime theater for any computer.

[![Updates channel](https://img.shields.io/badge/Telegram-Updates%20channel-blue?style=for-the-badge&logo=telegram)](https://t.me/anilibrix_plus) [![App chat](https://img.shields.io/badge/Telegram-App%20chat-blue?style=for-the-badge&logo=telegram)](https://t.me/anilibrix_plus_chat)

[![Download on Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/anilibrix-plus)

![Anilibrix](https://raw.githubusercontent.com/AnimeHaze/anilibrix-plus/lord/.github/assets/anilibrix.png)

### Feature Comparison: Anilibria (official) vs Anilibrix Plus

| Feature / Capability | AnilibriX (official) | AnilibriX Plus (unofficial fork) |
| :--- | :--- | :--- |
| **Authorization** | Standard login/password only | ✅ **VK login** <br> <details><summary>Screenshot</summary>![VK login](./assets/img.png)</details> |
| **Player controls** | No opening/ending skip | ✅ **Automatic opening skip** <br>✅ **Manual one-click skip** <br>✅ **Manual hotkey skip** <details><summary>Screenshots</summary>![Skip button](./assets/opening-skip.png)![Skip settings](./assets/opening-skip2.png)</details> |
| **Synchronization** | Watch history is stored locally and not synced | ✅ **Backup and restore** of watch data, linked to the account through a third-party server <br> <details><summary>Screenshot</summary>![Backups](./assets/snaps.png)</details> |
| **Random title** | No random release feature | ✅ **Random release button** <br> <details><summary>Screenshot</summary>![Random release](./assets/rand.png)</details> |
| **Integrations** | None | ✅ **Discord Rich Presence** (shows watch status) <br> Displays the app icon, poster, and information about the release being watched: current episode number, total episode count, title, release link, Anilibria website link, and time remaining until the end of the episode <br> <details><summary>Screenshot</summary>![Discord RPC](./assets/drpc.png)</details> |
| **Network and access** | One server | ✅ **API and static server switching** (custom endpoint, selection from a list, manual input) <br> <details><summary>Screenshot</summary>![Endpoint selection](./assets/endpoint.png)</details> ✅ **Stronger resistance to blocking** <br> ✅ **Aggressive local caching** <br> ✅ **Works with partial network loss** <br> ✅ **Proxy support** (flag `--proxy-server=http://127.0.0.1:8008` and a settings option)<br>✅ **Built-in Opera VPN** <br> <details><summary>OperaProxy screenshot</summary>![OperaProxy](./assets/operaproxy.png)</details> |
| **Interface (UI/UX)** | Window control button placement is fixed for the system type. <br> No scroll-to-top button | ✅ **Option to force window buttons to the right** <br> <details><summary>Screenshot</summary>![Window buttons](./assets/win_buttons.png)</details> <br>✅ **"UP" button** <br> <details><summary>Screenshot</summary>![Up button](./assets/up.png)</details> <br>✅ **Navigation buttons (back/forward)** <br>✅ **Share button** on the release page |
| **Release page** | Standard | ✅ **Related releases (franchises)** <details><summary>Screenshot</summary>![Related releases](./assets/fran.png)</details> ✅ **Episode release dates and titles** <details><summary>Screenshot</summary>![Episode dates](./assets/dates.png)</details> ✅ **List of people who worked on the release (team)** <details><summary>Screenshot</summary>![Release team](./assets/team.png)</details> ✅ **Rounded poster removed** in favor of a full poster <details><summary>Screenshot</summary>![Full poster](./assets/poster.png)</details> |
| **Favorites** | Standard list | ✅ **Sort by popularity** <br> <details><summary>Screenshot</summary>![Sort by popularity](./assets/fav_pop.png)</details> <br>✅ **Release status shown** in the card <br> <details><summary>Screenshot</summary>![Status in favorites](./assets/status.png)</details> <br>✅ **Persistent progress display with color coding** <br> <details><summary>Screenshot</summary>![Color-coded progress](./assets/fav_progress.png)</details> <br>✅ **Notification filter** (favorites only) <br> <details><summary>Screenshot</summary>![Notification filter](./assets/notify_fav.png)</details> <br>✅ **Shows how many users have it in favorites** (rating) <br> <details><summary>Screenshots</summary>![Favorites rating](./assets/fav_rating.png)![Rating everywhere](./assets/last_rating.png)</details> <br>✅ **Status filter** ("all statuses", "all except in progress") <br>✅ **Shows episode count per season** when known <br>✅ **Context menu for quickly marking watched episodes without opening the release** |
| **Torrents** | No list, torrent playback is broken | ✅ **Torrent list output** with the ability to open in an external client, download the file, and copy the magnet link <br> <details><summary>Screenshot</summary>![Torrent list](./assets/torrents.png)</details> |
| **System** | Standard | ✅ **Show config file** in settings, where all history and progress are stored <br> <details><summary>Screenshot</summary>![Show config](./assets/showconfig.png)</details> <br>✅ **Poster and static asset cache** <br>✅ **Window state saving** (position, fullscreen) <br>✅ Progress and data are **not deleted on uninstall** |
| **Platforms** | Windows, Linux, macOS (x64) | ✅ **Flatpak / RPM / DEB packages available** <br> ✅ **ARM build for macOS** without Rosetta 2 <br>✅ Linux package with the category `AudioVideo;Video;Player;` |
| **Content support** | Only video from Anilibria servers | ✅ **Support for Anilibria Rutube releases** in the player, marked as RUTUBE in episodes |
| **Fixes and improvements** | - | ✅ Fixed the progress bug for releases where episodes do not start from 1<br>✅ Fixed the computer going to sleep and the display turning off during playback<br>✅ Fixed the autoplay bug for episode 0<br>✅ Fewer account sign-outs, with automatic re-authorization<br>✅ Volume control now has 20 steps instead of 10<br>✅ Fixed startup when the config file is corrupted, where the app previously failed to launch<br>✅ Fixed announced releases disappearing from favorites<br>✅ Picture-in-picture no longer resets when switching episodes |

#### Anilibria: this is how anime sounds

### Player Hotkeys

| Key | Action |
|-----|--------|
| F | Toggle fullscreen mode |
| ← | Back |
| → | Forward |
| ↑ | Volume up, or mouse wheel |
| ↓ | Volume down, or mouse wheel |
| space | Play / pause |

Custom hotkeys can also be set in the settings for:

- Turning automatic opening skip on and off without leaving the player
- Skipping the opening

---

### Build and Run

<details>
<summary>🔧 Developer instructions (click to expand)</summary>

> **Required Node.js version: 14.x.x**  
> Other versions, especially newer ones, may have issues building native modules.

Before starting, copy and edit the example `.env` file:

```bash
cp .env.example .env
```

```bash
# Install and build dependencies
yarn install

# Start with hot reload on localhost:9080
yarn run serve

# Build the production version
yarn run build

# Run ESLint --fix for JS/Vue files and components in `src/`
yarn run lint:fix

# Build for all platforms
yarn run release

# Build for macOS
yarn run release:mac

# Build for Windows
yarn run release:win

# Build for Linux
yarn run release:lin
```

</details>

---

#### English translation by: [TomerGamerTV](https://github.com/TomerGamerTV) 😉

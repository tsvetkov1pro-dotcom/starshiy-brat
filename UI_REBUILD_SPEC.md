# UI_REBUILD_SPEC.md — Golden Master UI Rebuild

Статус: обязательная спецификация реализации
Ветка: `golden-master-ui-rebuild`
Приоритет: ниже PRODUCT.md/DESIGN.md по продуктовым правилам, выше текущей CSS/компонентной реализации по способу выполнения этой итерации.

## 1. Цель

Пересобрать визуальный слой «Старшего Брата» по утверждённому Golden Master screenshot, сохранив рабочую бизнес-логику: Telegram import, IndexedDB, поиск, рекомендации, избранное, профили, сферы и вызовы.

Критерий успеха: результат должен быть визуально сопоставим с утверждённым экраном, а не «похож по настроению».

## 2. Golden Master — обязательная геометрия desktop

На 1440px desktop целевая композиция:

- фиксированный светлый sidebar слева;
- широкий cinematic hero сверху основной области;
- строка SmartSearch перекрывает нижнюю границу hero и имеет почти ту же визуальную ширину;
- ниже одна строка: компактный блок «Выберите себя» + компактный блок «Подобрано для тебя» с 4 карточками;
- ниже компактная горизонтальная строка «Мои братья»;
- нижняя строка: «Сферы сообщества» примерно 60–65% ширины, «Похожие вызовы» примерно 35–40%;
- шесть сфер — полноценные крупные визуальные плитки 3×2;
- все карточки плотные, без 70–90% пустого пространства.

## 3. LOCKED visual language

Не переосмысливать без отдельного запроса пользователя:

- светлая кремовая основа;
- graphite/black + warm gold;
- cinematic urban hero;
- wordmark «СТАРШИЙ БРАТ» с короной;
- сепийные/графичные fallback portraits;
- визуальные мотивы сфер IT/AI, строительство, финансы, продажи, маркетинг, производство;
- левое меню: Главная / Найти брата / Мои братья / Сферы / Похожие вызовы; внизу Импорт чата;
- компактные карточки людей;
- Kowalski motion: press scale ~.97, короткие ease-out transitions, no transition: all.

## 4. ЗАПРЕЩЁННЫЕ ПОДХОДЫ — прошлые ошибки, которые нельзя повторять

### 4.1 Запрещено наслаивать hotfix CSS

Нельзя продолжать цепочку `globals.css -> hotfix.css -> qa-fixes.css` с взаимными override.

Для rebuild создаётся один новый stylesheet `golden-master.css`, который определяет геометрию нового UI. Старые `hotfix.css` и `qa-fixes.css` перестают подключаться из `main.tsx`.

### 4.2 Запрещено адаптировать дизайн под старую геометрию компонентов

Если существующий DOM/компонент мешает Golden Master — компонент переписывается. Нельзя сохранять огромную карточку только потому, что она уже есть.

### 4.3 Запрещены procedural / самодельные SVG-заглушки вместо утверждённой графики

Hero, logo, avatars, spheres должны использовать approved brand assets. Нельзя заменять их геометрическими «временными» иллюстрациями.

### 4.4 Запрещено растягивать низкокачественный raster-source

Asset должен использоваться в размерном режиме, который не превращает его в мыло. Для hero — правильный crop и `object-fit: cover`; для портретов — стабильный crop; для сфер — отдельный корректный crop на плитку.

### 4.5 Запрещено считать `CI green` доказательством визуального качества

CI подтверждает работоспособность, но не соответствие дизайну. До деплоя нужен отдельный visual comparison gate.

### 4.6 Запрещено иметь разные реализации поиска на главной и `/find`

Везде используется один `SearchBox` / SmartSearch с единым focus, autocomplete, keyboard navigation и submit flow.

### 4.7 Запрещено придумывать новые функции ради макета

Нет аккаунтов, уведомлений, сообщений, постов, событий, progress bars или других несуществующих сущностей.

## 5. Этапы выполнения

### Этап A — CSS architecture reset

- отключить `hotfix.css` и `qa-fixes.css`;
- оставить tokens + reset/base styles;
- создать `golden-master.css`;
- проверить отсутствие legacy selectors, которые меняют новую геометрию.

Gate: build проходит, страницы не получают старые override.

### Этап B — App shell + sidebar + hero + search

- пересобрать AppShell по Golden Master;
- sidebar правильной ширины и плотности;
- logo видимый, не raster rectangle;
- hero нужной пропорции;
- search почти во всю ширину hero и перекрывает нижнюю границу;
- удалить лишние декоративные подложки под hero/search.

Gate: screenshot 1440 визуально совпадает по верхней половине экрана.

### Этап C — home composition

- «Выберите себя» — компактный;
- «Подобрано для тебя» — 4 компактные карточки в одну строку;
- refresh реально меняет окно рекомендаций;
- «Мои братья» — одна плотная горизонтальная строка;
- «Сферы» 60–65%, «Вызовы» 35–40%;
- 6 сфер крупные, читаемые, 3×2;
- вызовы — 3 компактных rows с avatar stack.

Gate: full home screenshot сопоставим с Golden Master.

### Этап D — directory pages redesign

- `/find`: один SmartSearch, фокус с первого клика, autocomplete сразу;
- `/favorites`: компактная responsive grid/list без пустых giant cards;
- `/domains` и `/challenges`: плотные каталоги, не гигантские контейнеры;
- карточки не растягиваются длинным текстом или URL.

Gate: 1440/1280/390 без overflow, карточки плотные.

### Этап E — profile modal

- desktop modal/drawer 560–680px, хорошо сверстанный;
- mobile bottom sheet;
- приоритет: «Чем занимается» и «Чем может быть полезен»;
- затем важное/вызов/90 дней/Telegram/full profile;
- highlight активного поискового запроса сохраняется.

Gate: open/close/ESC/favorite/copy work.

### Этап F — asset normalization

- avatar frame и content centering;
- единый apparent head scale;
- hero crop без blur/растяжения;
- logo crisp и всегда видим;
- spheres: читаемый artwork, правильный contrast overlay.

Gate: ни один approved asset не заменён placeholder-графикой.

### Этап G — motion + polish

- hover только fine pointer;
- press scale .97;
- dropdown 150–200ms;
- cards 150–200ms;
- modal 240–300ms;
- reduced-motion support;
- no `transition: all`.

### Этап H — validation

Функционально:
- import;
- self select;
- recommendation refresh;
- name search;
- raw text search;
- morphology / related term search;
- autocomplete;
- Enter / arrows / Esc;
- favorite add/remove;
- modal;
- filters and highlights.

Визуально:
- 1440×1024;
- 1280×800;
- 390×844;
- сравнение desktop screenshot рядом с Golden Master.

Жёсткие критерии:
- JS errors = 0;
- horizontal overflow = 0;
- text outside cards = 0;
- giant empty cards = 0;
- legacy CSS override regressions = 0;
- missing logo = 0;
- search first-click failure = 0;
- system autocomplete dropdown = 0.

## 6. Definition of Done

Версия может быть задеплоена пользователю только если одновременно выполнены три условия:

1. Typecheck/unit/build/E2E зелёные.
2. Visual QA подтверждает Golden Master geometry и плотность.
3. Живой URL открыт после деплоя и проверен на актуальный SHA.

Если хотя бы один gate не пройден — ссылка не называется готовой.

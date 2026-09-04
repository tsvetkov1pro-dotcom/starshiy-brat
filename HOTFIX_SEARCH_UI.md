# Phase 5.1 — Search + UI Quality Hotfix

Status: implementation specification.  
Canonical visual source: `DESIGN.md` + approved desktop reference.  
Issue: #21.

## Цель

Поиск становится главным рабочим инструментом продукта. Параллельно исправляются текущие критические визуальные дефекты: переполнение карточек, неработающее обновление подборки, неверные имена, raster blur логотипа/графики, сплюснутые сферы и слабая карточка профиля.

## Этап 1 — мощный локальный поиск

Поиск обязан работать по имени, Telegram display name/username, городу, occupation, canHelpWith, currentChallenge, currentPriority, goal90Days, domains, challenges, searchKeywords и `rawProfileText`.

Обязательные возможности:
- русские словоформы;
- локальный semantic expansion без внешнего API;
- запрос `грузоперевозки` находит также реальные визитки с формулировками `логистика`, `доставка`, `перевозка грузов`, `грузовой транспорт`, `экспедирование`;
- семантическое расширение влияет только на поиск и никогда не добавляет факт в профиль;
- результат ранжируется по релевантности: identity → canHelpWith → occupation → domain/challenge → city/context → raw text;
- каждому результату показывается причина и релевантный фрагмент текста;
- прямые и связанные реальные слова подсвечиваются.

## Этап 2 — search assistant

Вместо системного browser dropdown используется собственный autocomplete.

Типы подсказок:
- брат;
- сфера;
- похожий вызов;
- связанный запрос.

Управление: Arrow Up/Down, Enter, Escape, mouse/fine pointer. Dropdown не должен выходить за экран.

## Этап 3 — качество данных

Поле имени очищается от вопросительных/служебных префиксов:
- `Как тебя зовут? - Александр` → `Александр`;
- `Имя: Кирилл Орлов` → `Кирилл Орлов`;
- `Меня зовут Степан` → `Степан`.

Очистка применяется при импорте и при чтении уже существующей локальной базы, чтобы hotfix исправлял текущие данные без обязательного повторного импорта.

## Этап 4 — «Подобрано для тебя»

`Обновить подборку` — реальная интерактивная кнопка. Она должна менять порядок/окно среди релевантных кандидатов, а не быть декоративной.

Desktop:
- ровно 4 компактные карточки в строке;
- убрать лишнюю пустую высоту;
- аватар, имя, мета, короткая причина;
- любой URL/длинный текст не расширяет grid;
- line-clamp + ellipsis + overflow-wrap.

## Этап 5 — визуальное качество

- удалить конфликт legacy `product.css` с текущей design system;
- логотип — crisp vector, без raster blur и белой подложки;
- avatar fallback — crisp vector illustrations, одинаковая круглая маска/crop;
- hero — масштабируемая vector cinematic composition по approved reference;
- 6 сфер — отдельные vector illustrations, не sprite; полноценная высота плиток;
- sidebar/search/layout сохраняют утверждённую конструкцию.

## Этап 6 — профиль брата

Desktop — удобный широкий drawer/modal; mobile — bottom sheet.

На первом экране доминируют:
1. Чем занимается.
2. Чем может быть полезен.

Далее: что важно, вызов, цель 90 дней, город/возраст, Telegram, полная визитка. Если профиль открыт из поиска/фильтра, связанные реальные слова остаются подсвеченными.

Telegram URL создаётся только при подтверждённом username. Иначе доступно только копирование имени.

## Этап 7 — QA gate

Обязательные размеры:
- 1440×1024;
- 1280×800;
- 390×844.

Обязательные сценарии:
- поиск exact name;
- поиск по rawProfileText;
- словоформа;
- semantic query (`грузоперевозки` ↔ `логистика/доставка/перевозка грузов`);
- autocomplete mouse + keyboard;
- подсветка совпадений;
- active domain/challenge filter highlighting;
- refresh recommendations реально меняет порядок;
- favorite add/remove;
- profile open/ESC;
- long name/URL/raw text;
- no Telegram username.

Release gate:
- typecheck = pass;
- unit = pass;
- production build = pass;
- Playwright desktop/mobile = pass;
- horizontal overflow = 0;
- console errors = 0;
- broken card/text overflow = 0;
- system search dropdown = 0;
- malformed question-as-name = 0.

Preview URL выдаётся пользователю только после прохождения gate и ручной проверки контрольных screenshots.

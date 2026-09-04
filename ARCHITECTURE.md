# ARCHITECTURE.md
# СТАРШИЙ БРАТ
## Техническая архитектура продукта

Статус: Technical Source of Truth  
Версия: 1.0 Draft  
Связанный продуктовый документ: [`PRODUCT.md`](./PRODUCT.md)

---

# 1. Назначение документа

Этот документ определяет техническую архитектуру «Старшего брата».

`PRODUCT.md` отвечает на вопрос **что и зачем мы строим**.  
`ARCHITECTURE.md` отвечает на вопрос **как именно это должно быть реализовано**.

Если техническое решение противоречит `PRODUCT.md`, приоритет имеет `PRODUCT.md`.

---

# 2. Архитектурная цель MVP

Первая серьёзная версия должна быть полноценной PWA, которая:

- работает на desktop и mobile;
- импортирует Telegram HTML локально;
- не отправляет визитки участников на внешний сервер;
- устойчиво разбирает нестандартные анкеты;
- хранит большую базу в IndexedDB;
- обеспечивает быстрый поиск по 200–300+ профилям;
- строит объяснимые персональные рекомендации;
- работает офлайн после загрузки оболочки приложения;
- не требует регистрации и собственного backend для MVP.

---

# 3. Базовый стек

Для финальной реализации MVP фиксируется следующий базовый стек.

## Frontend

- React
- TypeScript
- Vite
- CSS / CSS Modules или эквивалентная локальная система стилей без тяжёлой UI-библиотеки

Причина: продукт требует кастомный визуальный язык, компактную PWA, локальную обработку файлов и высокую скорость разработки без серверной зависимости.

## PWA

- Web App Manifest
- Service Worker
- `vite-plugin-pwa` или эквивалентная проверенная интеграция

## Local database

- IndexedDB
- Dexie как тонкая TypeScript-обёртка над IndexedDB

`localStorage` запрещён для хранения полной базы профилей.

## Testing

- Vitest — unit/integration tests
- Playwright — browser/e2e tests

## Icons

- SVG icons
- единый icon set или собственные SVG

Не использовать emoji как системные UI-иконки.

---

# 4. Архитектурный принцип: local-first

MVP является local-first приложением.

Путь данных:

```text
Telegram Desktop export
        ↓
messages.html
        ↓
File API
        ↓
Telegram Parser
        ↓
Normalized Profiles
        ↓
Classification / Tags
        ↓
IndexedDB
        ↓
Search + Recommendation Engine
        ↓
UI
```

Исходный файл Telegram не должен отправляться на сервер.

---

# 5. Основные модули

Рекомендуемая структура:

```text
src/
  app/
    App.tsx
    router.tsx
    providers/

  components/
    ui/
    layout/

  features/
    import/
    profiles/
    search/
    self-selection/
    recommendations/
    favorites/
    domains/
    challenges/

  lib/
    telegram-parser/
    classification/
    recommendation-engine/
    search-engine/
    storage/
    telegram-contact/

  db/
    schema.ts
    migrations.ts

  workers/
    search.worker.ts
    parser.worker.ts

  styles/
    tokens.css
    globals.css

  types/
    profile.ts
    domain.ts
    challenge.ts

public/
  manifest.webmanifest
  icons/
```

Структура может уточняться при реализации, но границы ответственности модулей должны сохраняться.

---

# 6. Нормализованная модель профиля

Базовая модель участника:

```ts
interface Profile {
  id: string;
  telegramDisplayName: string;
  telegramUsername?: string;
  name?: string;
  city?: string;
  age?: number;
  occupation?: string;
  currentChallenge?: string;
  currentPriority?: string;
  goal90Days?: string;
  canHelpWith?: string;
  domains: string[];
  challenges: string[];
  searchKeywords: string[];
  rawProfileText: string;
  sourceMessageId?: string;
  sourceDate?: string;
  realImageReference?: string;
  avatarSeed: string;
}
```

Поля могут быть пустыми. Нельзя заполнять отсутствующие факты догадками.

`isFavorite` не является свойством исходного профиля и хранится отдельно как пользовательское состояние.

---

# 7. Stable ID

`Profile.id` должен быть детерминированным и устойчивым между повторными импортами одной и той же визитки.

Приоритет идентификации:

1. Telegram username, если он реально принадлежит автору;
2. source message id + display name;
3. стабильный hash нормализованного display name + основной визитки.

Нельзя использовать случайный UUID при каждом импорте, иначе разрушатся избранное и выбранный пользователь.

---

# 8. Telegram Parser

Parser — отдельный модуль и одна из критических частей продукта.

Он должен:

- читать HTML через DOMParser;
- проходить только реальные Telegram message nodes;
- учитывать `joined` messages, где имя автора может отсутствовать;
- forward-fill автора только в пределах корректной последовательности Telegram сообщений;
- различать service messages и пользовательские сообщения;
- сохранять `message id` и дату;
- извлекать текст без потери абзацев;
- извлекать реальные ссылки `https://t.me/...`;
- не считать любую найденную Telegram-ссылку username автора;
- связывать attachment с профилем только при уверенной связи;
- объединять несколько последовательных сообщений одного автора, если визитка разбита на части;
- не падать на отсутствующих пунктах анкеты.

---

# 9. Извлечение структуры анкеты

Нумерация 1–8 используется как сильный сигнал, но не как абсолютное правило.

Parser должен поддерживать:

- `1.` / `1)` / emoji-number variants;
- пропущенные номера;
- повторённые номера;
- объединённые пункты `6-7`;
- свободный текст;
- возраст внутри первого пункта;
- деятельность внутри третьего или другого пункта;
- визитки, разбитые на несколько joined-сообщений.

Извлечение выполняется в два этапа:

1. segmentation — деление текста на смысловые части;
2. field mapping — определение назначения сегмента по номеру, ключевым словам и контексту.

Если поле определить нельзя уверенно, оно остаётся пустым, а исходный текст сохраняется в `rawProfileText`.

---

# 10. Telegram username

Система не должна считать `from_name` Telegram username.

Username сохраняется только если:

- существует реальная ссылка `https://t.me/<username>`;
- она относится к самому автору, а не к упомянутому человеку;
- связь подтверждается контекстом сообщения или последовательностью сообщений.

Если уверенности нет — `telegramUsername = undefined`.

UI тогда показывает `Скопировать имя`, а не фальшивую кнопку прямого перехода.

---

# 11. Классификация сфер

`domains[]` являются вычисляемыми классификациями на основе исходной визитки.

Первая версия использует прозрачный словарь правил.

Пример верхнеуровневых сфер:

- IT / AI
- Продажи
- Маркетинг
- Финансы
- Строительство
- Производство
- Право
- Медицина / здоровье
- Образование
- HoReCa
- E-commerce
- Логистика
- Недвижимость
- Другое

Один человек может относиться к нескольким сферам.

Классификация не заменяет исходные данные и должна быть пересчитываемой.

---

# 12. Классификация вызовов

`challenges[]` также являются вычисляемыми тегами.

Первая версия использует понятные пользователю категории, например:

- Поиск клиентов
- Продажи
- Масштабирование
- Долги / финансы
- Кассовый разрыв
- Смена деятельности
- Поиск работы
- Запуск бизнеса
- Партнёрство
- Отношения / развод
- Здоровье / спорт
- Эмоциональное состояние
- Баланс работа / семья

Один профиль может иметь несколько вызовов.

---

# 13. IndexedDB

IndexedDB является основным локальным хранилищем.

Минимальные таблицы:

```text
profiles
importMeta
classificationMeta
```

Пример схемы:

```text
profiles
  id (primary key)
  telegramDisplayName
  telegramUsername
  name
  city
  age
  occupation
  currentChallenge
  currentPriority
  goal90Days
  canHelpWith
  domains[]
  challenges[]
  searchKeywords[]
  rawProfileText
  sourceMessageId
  sourceDate
  avatarSeed
```

`importMeta` хранит:

- import timestamp;
- source file name;
- number of parsed messages;
- number of normalized profiles;
- parser version.

---

# 14. localStorage

В `localStorage` допускается хранить только небольшой пользовательский state:

```text
selectedSelfId
favoriteProfileIds[]
selectedInterests[]
selectedChallenges[]
uiPreferences
onboardingState
```

Запрещено:

- сохранять весь `messages.html`;
- сохранять массив профилей;
- сохранять base64-изображения;
- дублировать IndexedDB.

---

# 15. Импорт и повторный импорт

При повторном импорте приложение должно:

1. распарсить новую выгрузку;
2. построить stable IDs;
3. сравнить базу с текущей;
4. добавить новые профили;
5. обновить изменившиеся профили;
6. удалить или пометить отсутствующие профили только по явной стратегии;
7. сохранить favorites и selectedSelf, если stable ID не изменился;
8. пересчитать domains/challenges/search index.

Импорт должен быть транзакционным: ошибка в середине процесса не должна оставлять половину новой базы.

---

# 16. Search Engine

Поиск работает локально.

Индексируемые поля:

- name;
- telegramDisplayName;
- telegramUsername;
- city;
- occupation;
- canHelpWith;
- currentChallenge;
- currentPriority;
- goal90Days;
- domains;
- challenges;
- searchKeywords;
- rawProfileText.

Для 200–300 профилей допустим собственный lightweight index или небольшая search-библиотека.

Тяжёлый внешний search backend для MVP не нужен.

---

# 17. Ранжирование поиска

Базовый порядок веса:

1. точное совпадение имени;
2. совпадение display name / username;
3. совпадение `canHelpWith`;
4. совпадение `occupation`;
5. совпадение domains/challenges;
6. совпадение остальных полей;
7. совпадение raw text.

Поиск должен быть детерминированным и объяснимым.

---

# 18. Recommendation Engine v1

Первая версия recommendation engine — локальная и heuristic.

Вход:

```text
selectedSelf profile
selected interests
selected challenges
all other profiles
```

Пример весов:

```text
+5  canHelpWith кандидата совпадает с задачей пользователя
+4  domain кандидата совпадает с выбранным интересом
+3  общий challenge
+2  профессиональное пересечение
+2  пересечение значимых keywords
+1  общий город, если это полезно сценарию
```

Точные веса должны быть вынесены в конфигурацию и покрыты тестами.

Собственный профиль всегда исключается.

---

# 19. Объяснение рекомендации

Recommendation Engine возвращает не только score, но и причины.

```ts
interface Recommendation {
  profileId: string;
  score: number;
  reasons: RecommendationReason[];
}
```

UI не обязан показывать numeric score.

UI показывает реальные причины:

- «Может помочь с CRM»;
- «Работает в производстве»;
- «Похожий вызов: поиск клиентов».

Нельзя генерировать причины, которые не подтверждаются исходным профилем.

---

# 20. Semantic / AI layer

Embeddings и semantic search относятся к следующей фазе и не блокируют MVP.

Когда AI-уровень будет добавлен:

- исходный текст остаётся источником истины;
- semantic layer используется для поиска сходства;
- AI не создаёт новые биографические факты;
- UI должен отличать исходные данные от вычисленного summary;
- отправка приватных данных во внешний API требует отдельного продуктового и privacy-решения.

До такого решения MVP остаётся локальным.

---

# 21. UI architecture

Основные экраны / состояния:

```text
/
  Главная

/search
  Найти брата

/favorites
  Мои братья

/domains
  Сферы

/challenges
  Похожие вызовы

/import
  Импорт чата
```

На mobile маршруты могут визуально отображаться через bottom navigation.

---

# 22. Profile UI

Profile не является отдельной социальной страницей.

Desktop:
- modal или drawer.

Mobile:
- bottom sheet / full-height sheet.

Первый экран показывает summary из реальных полей.

Ниже — полная структурированная визитка.

ESC закрывает modal/drawer на desktop.

---

# 23. Favorites

Favorites хранят только массив stable profile IDs.

Избранное не модифицирует исходный профиль.

При повторном импорте ссылки восстанавливаются по stable ID.

---

# 24. Avatar fallback

Fallback avatar должен рассчитываться на лету из `avatarSeed`.

Не хранить сотни base64-аватаров в IndexedDB/localStorage.

Рекомендуемый вариант:

- CSS/SVG composition;
- initials;
- детерминированный набор параметров из hash имени;
- фирменные graphite / gold / amber variants.

Это декоративная идентификация, а не имитация реальной фотографии.

---

# 25. PWA cache policy

Service Worker может кешировать:

- application shell;
- CSS;
- JS bundles;
- icons;
- статические брендовые assets.

Service Worker НЕ должен кешировать импортированный `messages.html` как сетевой ресурс.

Локальные пользовательские данные находятся в IndexedDB.

---

# 26. Privacy boundary

До отдельного решения запрещено:

- отправлять визитки на analytics endpoints;
- логировать полный текст профилей в remote logs;
- отправлять `messages.html` в error tracking;
- публиковать реальные exports в GitHub;
- хранить реальные данные участников в статическом production bundle.

Production приложение должно поставляться без встроенной реальной базы сообщества.

Пользователь импортирует её локально.

---

# 27. Error handling

Не использовать `alert()` для системных ошибок приложения.

Ошибки отображаются через нормальные UI states / toast / inline error.

Минимальные сценарии:

- неподдерживаемый файл;
- повреждённый HTML;
- не найдено ни одной визитки;
- частично распознанная выгрузка;
- ошибка IndexedDB;
- недостаточно места;
- ошибка обновления базы.

Для каждого состояния должна быть понятная следующая кнопка или действие.

---

# 28. Performance

Целевой размер базы MVP: минимум 500 профилей без деградации UX.

Требования:

- поиск без заметной задержки;
- не рендерить весь каталог одновременно;
- incremental rendering / pagination;
- тяжёлые parser/search операции при необходимости выносить в Web Worker;
- не создавать сотни тяжёлых DOM/SVG nodes вне viewport без необходимости.

---

# 29. Design engineering

Визуальная реализация следует `PRODUCT.md` и принципам Emil Kowalski design engineering.

Фиксируется:

```css
--ease-out: cubic-bezier(.23, 1, .32, 1);
--ease-in-out: cubic-bezier(.77, 0, .175, 1);
--ease-drawer: cubic-bezier(.32, .72, 0, 1);
```

Pressable элементы:

```css
transform: scale(.97);
```

Требования:

- никаких `transition: all`;
- UI-анимации в основном до 300 ms;
- hover только для fine pointer;
- `prefers-reduced-motion`;
- никакой декоративной анимации, мешающей частым действиям.

---

# 30. Testing strategy

## Unit tests

Обязательно покрываются:

- parser;
- field mapping;
- stable ID;
- domains classifier;
- challenges classifier;
- recommendation scoring;
- Telegram username extraction.

## Fixture tests

В публичном репозитории нельзя хранить реальные визитки участников.

Для тестов создаются синтетические fixtures без реальных персональных данных:

```text
tests/fixtures/telegram/
```

Fixtures должны покрывать реальные структурные проблемы экспорта:

- joined messages;
- duplicate numbers;
- missing fields;
- attachments;
- Telegram links to another person;
- multi-message profile.

## E2E

Playwright проверяет минимум:

- импорт;
- поиск;
- выбор себя;
- рекомендации;
- favorites;
- domains;
- challenges;
- profile open/close;
- повторный импорт;
- mobile 390 px;
- desktop 1440 px.

---

# 31. Definition of Done для технической реализации

Релиз не считается готовым, пока не выполнено:

```text
JS errors = 0
critical console errors = 0
horizontal overflow = 0
quota errors = 0
broken navigation = 0
broken import scenarios = 0
```

И пройдены основные пользовательские сценарии из `PRODUCT.md`.

---

# 32. Deployment

Production deployment должен выполняться из `main` после QA.

Рекомендуемая схема:

```text
feature branch
  ↓
PR
  ↓
checks / Playwright
  ↓
main
  ↓
production deployment
```

Нельзя считать production обновлённым до проверки фактического опубликованного URL.

---

# 33. Что намеренно отсутствует в MVP

Архитектура MVP не включает:

- backend API;
- account system;
- собственный чат;
- social graph;
- server database участников;
- admin panel;
- Telegram MTProto login;
- серверное хранение exports;
- обязательный AI API.

Эти компоненты могут появиться только после отдельного продуктового решения.

---

# 34. Правило изменения архитектуры

Любое существенное изменение должно отвечать на три вопроса:

1. Какую проблему из `PRODUCT.md` оно решает?
2. Не ухудшает ли оно privacy/local-first модель?
3. Почему существующая архитектура недостаточна?

Крупные решения фиксируются отдельным ADR или обновлением `ARCHITECTURE.md`.

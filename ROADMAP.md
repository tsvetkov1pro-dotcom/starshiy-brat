# ROADMAP.md
# СТАРШИЙ БРАТ
## Дорожная карта до первого серьёзного релиза

Статус: Delivery Plan  
Связанные документы: [`PRODUCT.md`](./PRODUCT.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

# 1. Цель roadmap

Этот документ определяет порядок разработки финального продукта.

Главный принцип: не собирать очередной большой HTML одним прыжком. Каждый слой должен быть проверен до перехода к следующему.

---

# 2. Этап 0 — фундамент проекта

Результат этапа:

- публичный GitHub repository;
- `PRODUCT.md`;
- `ARCHITECTURE.md`;
- `SECURITY.md`;
- `.gitignore`;
- базовый README;
- выбран frontend stack;
- CI/test strategy зафиксирована.

Definition of Done:

- документы существуют в `main`;
- нет реальных Telegram-данных в repository;
- любой новый разработчик или AI-agent может понять продукт без старых чатов.

---

# 3. Этап 1 — application scaffold

Создать production-ready каркас приложения:

- React + TypeScript + Vite;
- базовые маршруты;
- design tokens;
- responsive shell;
- desktop sidebar;
- mobile navigation;
- PWA manifest;
- test runner;
- Playwright;
- IndexedDB layer.

На этом этапе не переносить старые монолитные HTML как основу архитектуры.

Definition of Done:

- приложение запускается локально;
- сборка проходит;
- unit tests запускаются;
- Playwright запускается;
- PWA shell устанавливаем;
- desktop/mobile layout не имеет overflow.

---

# 4. Этап 2 — Telegram Parser

Отдельно реализовать и протестировать parser.

Функции:

- чтение `messages.html`;
- default/joined messages;
- author forward-fill;
- service messages ignored;
- объединение частей визитки;
- структурирование 1–8;
- нестандартная нумерация;
- links / username extraction;
- attachments metadata;
- stable profile IDs;
- deduplication.

В repository использовать только синтетические fixtures.

Definition of Done:

- parser покрыт unit tests;
- типовые и сломанные анкеты разбираются без crash;
- неизвестные поля остаются неизвестными;
- parser не придумывает факты;
- повторный парсинг одной базы создаёт те же profile IDs.

---

# 5. Этап 3 — Local Data Layer

Реализовать IndexedDB.

Функции:

- schema;
- migrations;
- profiles storage;
- import metadata;
- transaction-based import;
- repeat import;
- preservation of favorites/self selection;
- database reset.

Definition of Done:

- нет полной базы в localStorage;
- quota error из прошлых прототипов невозможен при штатной работе;
- повторный импорт не ломает user state;
- ошибка импорта не оставляет половину обновлённой базы.

---

# 6. Этап 4 — Classification Layer

Создать domains/challenges classification.

Функции:

- прозрачный rule dictionary;
- multi-domain profiles;
- multi-challenge profiles;
- пересчёт при импорте;
- версия classifier;
- unit tests.

Definition of Done:

- сферы строятся из реальных профилей;
- количества в UI вычисляются динамически;
- никаких хардкодных `42`, `31`, `27` из макета;
- каждый тег можно объяснить исходным текстом.

---

# 7. Этап 5 — Search Engine

Реализовать быстрый локальный поиск.

Поддержать:

- имя;
- display name;
- username;
- город;
- occupation;
- canHelpWith;
- domains;
- challenges;
- goals;
- raw text.

Definition of Done:

- точное имя ранжируется первым;
- запросы по компетенции дают релевантных людей;
- поиск работает мгновенно на 500 профилях;
- empty state понятен;
- поиск не блокирует UI.

---

# 8. Этап 6 — Главная страница

Реализовать утверждённую архитектуру главной:

1. Sidebar / mobile navigation.
2. Hero.
3. Search bridge.
4. «Выберите себя».
5. «Подобрано для тебя».
6. «Мои братья».
7. «Сферы сообщества».
8. «Кто проходит через похожие вызовы».

Визуальный язык:

- светлая рабочая часть;
- городское братство;
- graphite / gold / amber;
- компактные поверхности;
- никакой generic SaaS эстетики.

Definition of Done:

- максимально близко утверждённому продуктово-дизайнерскому референсу;
- 1440 px и 390 px проверены;
- все блоки используют реальные вычисленные данные;
- каждая плитка/карточка ведёт к действию.

---

# 9. Этап 7 — Profile / Contact UX

Реализовать карточку и полный профиль.

Desktop:
- modal/drawer.

Mobile:
- bottom sheet.

Сначала показывать:

- чем может помочь;
- что сейчас важно;
- чем занимается;
- город;
- возраст;
- Telegram.

Далее — полная визитка.

Definition of Done:

- star favorite работает;
- ESC закрывает desktop profile;
- copy feedback работает;
- direct Telegram link появляется только при настоящем username;
- нет выдуманных контактов.

---

# 10. Этап 8 — Recommendation Engine v1

Реализовать heuristic recommendation engine.

Вход:

- selected self;
- selected interests;
- selected challenges.

Выход:

- ranked profiles;
- reasons[];
- category label.

Definition of Done:

- self исключён;
- рекомендации детерминированы;
- причины подтверждаются исходными данными;
- UI не показывает fake percentages;
- unit tests покрывают scoring.

---

# 11. Этап 9 — Interaction polish

После функциональной стабильности выполнить design engineering pass.

Обязательно:

- original Emil Kowalski design engineering principles;
- press feedback;
- custom easing;
- drawer/modal motion;
- correct hover behavior;
- focus states;
- reduced motion;
- loading/empty/error states.

Не использовать анимацию как замену хорошей композиции.

Definition of Done:

- UI чувствуется быстрым;
- частые действия не тормозятся анимациями;
- отсутствует `transition: all`;
- mobile touch targets адекватны.

---

# 12. Этап 10 — PWA / Offline

Завершить PWA.

Функции:

- manifest;
- icons;
- service worker;
- offline shell;
- installability;
- update strategy.

Definition of Done:

- приложение устанавливается через HTTPS;
- после загрузки shell открывается offline;
- imported private data не кешируется как network asset;
- update приложения не разрушает IndexedDB.

---

# 13. Этап 11 — Full QA

Desktop target:

`1440 × 1024`

Mobile target:

`390 × 844`

Прогнать:

- clean start;
- import;
- repeat import;
- search by name;
- search by skill;
- choose self;
- select tags;
- recommendations;
- favorite/unfavorite;
- domains;
- challenges;
- profile;
- Telegram copy/open;
- reload persistence;
- offline shell;
- broken file;
- empty import.

Release gates:

```text
JS errors = 0
critical console errors = 0
horizontal overflow = 0
quota errors = 0
broken interactions = 0
```

---

# 14. Этап 12 — Production deployment

После QA:

- merge в `main`;
- production build;
- deploy;
- открыть production URL;
- повторить smoke tests на production;
- только после этого считать релиз опубликованным.

---

# 15. После MVP — Semantic Search

Не начинать до стабильного MVP.

Следующая фаза:

- embeddings;
- semantic profile similarity;
- natural language queries;
- improved recommendation ranking;
- explainable semantic reasons.

Перед отправкой реальных Telegram-визиток во внешний AI/API требуется отдельное privacy-решение.

---

# 16. После MVP — Organizer Insights

Отдельная будущая продуктовая ветка:

- карта компетенций сообщества;
- дефицит компетенций;
- частые проблемы;
- потенциально полезные знакомства;
- тематические кластеры.

Не смешивать этот режим с основным пользовательским MVP.

---

# 17. Правило выполнения roadmap

Каждый этап проходит четыре состояния:

```text
Requirement
→ Implementation
→ Functional Verification
→ Visual Verification
```

Переходить дальше только после проверки текущего слоя.

Главное правило проекта:

> Сначала устойчивость и достоверность данных, затем функциональность, затем визуальная полировка, затем production.

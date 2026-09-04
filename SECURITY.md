# SECURITY.md
# СТАРШИЙ БРАТ
## Privacy & Security Policy for Development

Статус: обязательные правила для публичного репозитория  
Связанные документы: [`PRODUCT.md`](./PRODUCT.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

# 1. Главное правило

Репозиторий `starshiy-brat` публичный.

Поэтому в GitHub нельзя коммитить реальные персональные данные участников Telegram-сообщества.

Код и документация могут быть публичными. Реальная база сообщества — нет.

---

# 2. Что запрещено коммитить

Никогда не добавлять в repository:

- `messages.html` из реального Telegram-экспорта;
- ZIP-архивы Telegram export;
- реальные фотографии участников;
- реальные attachment-файлы из Telegram export;
- локальные IndexedDB dumps;
- JSON/CSV с реальными профилями;
- реальные Telegram usernames в test fixtures, если они взяты из сообщества;
- `.env`;
- API keys;
- access tokens;
- credentials;
- cookies;
- production secrets;
- локальные browser storage exports;
- screenshots с чувствительными данными без отдельной проверки.

---

# 3. Source data policy

Production build не должен содержать встроенную реальную базу сообщества.

Пользователь получает чистое приложение и самостоятельно импортирует `messages.html` локально.

Исходный Telegram export остаётся на устройстве пользователя.

---

# 4. Local processing

До отдельного продуктового решения:

- parsing выполняется локально;
- classification выполняется локально;
- search выполняется локально;
- recommendation engine v1 выполняется локально;
- profiles хранятся в IndexedDB пользователя.

Никакой server sync базы участников в MVP нет.

---

# 5. Analytics

До отдельного решения запрещено отправлять в analytics:

- полные тексты визиток;
- имена участников;
- usernames;
- города, связанные с конкретным профилем;
- личные проблемы;
- цели на 90 дней;
- `canHelpWith` в связке с идентичностью человека;
- raw search queries, если они могут содержать персональные сведения.

Если analytics будет добавлена, по умолчанию она должна собирать только технические/агрегированные события без содержимого профилей.

---

# 6. Error tracking

Нельзя автоматически отправлять в remote error tracker:

- `rawProfileText`;
- DOM содержимое imported Telegram HTML;
- IndexedDB records;
- Telegram links;
- attachments;
- пользовательские search strings без очистки.

Ошибки должны логировать технический контекст, а не персональные данные.

---

# 7. Test fixtures

Все публичные tests используют синтетические данные.

Допустимо имитировать структуру реального Telegram export, но:

- имена вымышленные;
- usernames вымышленные;
- тексты анкет вымышленные;
- фотографии отсутствуют или синтетические;
- никакая fixture не должна быть копией реальной визитки.

Fixtures должны тестировать форму данных, а не реальные данные людей.

---

# 8. Telegram contacts

Прямой Telegram URL допустим только для подтверждённого username.

Запрещено:

- генерировать `t.me/...` из display name;
- угадывать username;
- связывать упомянутый в тексте username с автором без уверенного контекста;
- публиковать extracted contact directory в repository.

---

# 9. Images

Реальное изображение участника используется только локально, если оно присутствует в пользовательском export и может быть уверенно связано с профилем.

Fallback avatar должен быть декоративным и не имитировать внешность реального человека.

---

# 10. Service Worker

Service Worker может кешировать только application shell и публичные assets.

Он не должен превращать импортированный Telegram HTML в публичный/cacheable network resource.

---

# 11. Deployment

Перед production deployment проверять:

- в bundle нет `messages.html`;
- в `public/` нет реальных Telegram exports;
- source maps не содержат встроенных fixtures с реальными данными;
- environment secrets не попали в client bundle;
- build не включает локальные debug dumps.

---

# 12. Git history

`.gitignore` не является полной защитой.

Если приватный файл уже попал в commit, простого удаления следующим commit недостаточно — содержимое остаётся в Git history.

В таком случае нужно:

1. считать данные потенциально опубликованными;
2. удалить их из истории repository;
3. сменить секреты, если были опубликованы credentials;
4. проверить forks/caches при необходимости.

---

# 13. Pull Request checklist

Каждый PR, связанный с import/data, должен отвечать:

- Используются только synthetic fixtures?
- Нет ли реального `messages.html`?
- Нет ли реальных Telegram names/usernames?
- Не добавилась ли remote отправка profile data?
- Не логируется ли raw profile text?
- Не сохраняется ли полная база в localStorage?

---

# 14. AI / Semantic Search

Если в будущем появится внешний AI/embeddings provider, это отдельное архитектурное и privacy-решение.

До его утверждения запрещено автоматически отправлять реальные визитки внешнему AI API.

Нужно заранее определить:

- какие поля отправляются;
- куда;
- на каком основании;
- как долго данные хранятся;
- можно ли отказаться;
- можно ли выполнить embeddings локально.

---

# 15. Public repository rule

Публичность проекта означает:

> Исходный код продукта открыт для просмотра, но данные сообщества не являются частью открытого исходного кода.

Это правило является обязательным для всех будущих чатов, разработчиков, AI-agents и pull requests.

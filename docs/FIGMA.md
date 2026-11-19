# Figma: «Фокус» — Time Manager / UI Kit

**Файл:** <https://www.figma.com/design/J0x2caFQTzno3mkNgq7tK6/Untitled>

Файл создан в вашем Figma-аккаунте и подключён через DSH-to-Figma
(local backend, companion 0.4.1). Все экраны — настоящие редактируемые слои
Figma: Auto Layout, текстовые стили, переменные, компоненты и варианты.
Скриншоты сайта в файл не вставлялись.

## Ограничение тарифа

Figma Starter разрешает **3 страницы на файл**. Поэтому вместо 8 отдельных
страниц структура собрана из трёх страниц и именованных секций внутри них:

| Страница Figma | Секции / содержимое |
| --- | --- |
| `00 — Cover` | `00 — Cover / Focus` |
| `01–02 — System & Components` | `Design System / Foundations`, `Components / Library` |
| `03–07 — Product Screens` | `MAIN DASHBOARD`, `STATISTICS`, `SETTINGS`, `FORMS & MODALS`, `05 — Guest timer`, `06 — Responsive Design`, `INTERACTION STATES` |

Это соответствует запрошенным разделам 00–07, но без обхода ограничения
тарифа. Для 8 физических страниц нужен Figma Professional.

## Что внутри

### Foundations
- Коллекция переменных **Focus / Tokens**, режим **Light**, 39 переменных:
  25 цветов, 10 spacing, 4 радиуса.
- 10 текстовых стилей: Display, H1–H3, Body, Body/Medium, Label/Small,
  Label/Meta, Label/Micro, Mono/Timer, Mono/Small.
- Палитра, типографические образцы, шкала отступов и радиусов.
- Все заливки ключевых элементов привязаны к переменным; образцы используют
  реальные текстовые стили.

### Components
- `Logo / Primary`, `Logo / Inverse` (в auth-aside), `Avatar / Default`.
- `Button` — Type × Size (8 вариантов, Auto Layout).
- `Badge` — Tone (3 варианта).
- `Field` — Type × State (12 вариантов, включая Focus и Error).
- `Icon Button` — Target/Edit/Delete/Stop/Close.
- `Task Row` — State=Default/Selected/Completed.
- `Timer Panel` — State=Idle/Running/Paused/Break.
- `Stats / Strip` с переопределяемыми текстовыми слоями.
- `Navigation / Desktop`.
- `Toast` — Tone=Success/Error/Info.
- `Modal / Task`.
- `Skeleton / Task row` для состояния загрузки.
- `Auth / Aside` — общая тёмная панель auth-экранов.

### Screens
- Dashboard 1440×900, Statistics 1440×1180, Settings 1440×1520.
- Login, Register, Forgot password, Reset password 1440×900.
- Guest Timer 1440×900 — публичный таймер без аккаунта.
- Mobile Dashboard 390×844, Mobile Tasks 390×844,
  Mobile Statistics 390×844, Mobile Login 390×844.
- Tablet Dashboard 768×900.
- Interaction states: Running, Paused, Break, Task modal overlay,
  Login error modal, Empty tasks.
- Login-экраны содержат ссылку на публичный таймер — как на сайте.
- Cover 1440×900.

## Как открыть

1. Откройте файл по ссылке выше (имя «Untitled» — переименуйте в
   «Фокус — Time Manager / UI Kit»; Figma не позволяет менять имя файла
   из Plugin API).
2. Стартуйте с `00 — Cover`, затем `01–02` и `03–07`.
3. Компоненты лежат в `Components / Library`; экраны используют их
   инстансы. Переменные — в панели Local variables, стили — в Local styles.

## Синхронизация с сайтом

- Цвета, типографика, радиусы и отступы совпадают с
  `frontend/src/styles/tokens.css`.
- Компоненты повторяют реальные React-компоненты: кнопки, поля, task row,
  timer panel, navigation, toast, modal.
- Экраны соответствуют маршрутам `/`, `/stats`, `/settings`, `/login`,
  `/register`, `/forgot`, `/reset` и мобильной вёрстке.

## Ограничения и честные замечания

- Нет native prototype-анимаций: motion не входил в задачу; статические
  состояния и компоненты редактируемы.
- Имя файла остаётся «Untitled» до ручного переименования.
- 8 страниц невозможны на Starter; использованы 3 страницы + секции.
- Figma-файл отдельный от кода; токены синхронизированы вручную по
  `docs/DESIGN_SYSTEM.md`.

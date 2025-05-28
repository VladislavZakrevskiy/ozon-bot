const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Коврики предверные', signatures: ['Коврик домашний'], money: 100 },
  { name: 'Специнструменты для автомобиля', signatures: ['Съемники обшивок'], money: 101 },
  { name: 'Пневмоинструменты', signatures: ['Пистолет для подкачки шин'], money: 102 },
  {
    name: 'Инструменты для удаления вмятин',
    signatures: ['Автомобильная присоска'],
    money: 103,
  },
  { name: 'Чехлы и накидки', signatures: ['Чехол солнцезащитного козырька'], money: 104 },
  {
    name: 'Подлокотники',
    signatures: ['Дверные подлокотники', 'Чехол на штатный подлокотник'],
    money: 105,
  },
  { name: 'Материалы для обшивки', signatures: ['Верхняя часть обшивки дверей'], money: 106 },
  {
    name: 'Чехлы и накидки на сидения',
    signatures: ['Защитная накидка на спинку сиденья'],
    money: 107,
  },
  {
    name: 'Коврики в салон',
    signatures: ['Коврики в салон', 'Ворсовые коврики'],
    money: 108,
  },
  {
    name: 'Коврики и чехлы в багажник',
    signatures: ['Коврик ЭВА Сота в багажник', 'Коврик ЭВА Ромб в багажник', 'Коврик из Эко-Кожи'],
    money: 109,
  },
  { name: 'Коврики на торпеду', signatures: ['Накидка на панель приборов'], money: 110 },
  {
    name: 'Прочие элементы тюнинга',
    signatures: ['Декоративные вставки', 'Накладки для крыши', 'Цурикава'],
    money: 111,
  },
  {
    name: 'Защита внешних частей',
    signatures: ['Накладки для крыши (Заглушки молдинга)', 'Накладка на кузов'],
    money: 112,
  },
  {
    name: 'Крепления и сетки',
    signatures: ['Багажный карман', 'Лента фиксатор'],
    money: 113,
  },
  { name: 'Запчасти для КПП', signatures: ['Чехол КПП'], money: 114 },
  { name: 'Комплектующие стеклоомывателя ', signatures: ['Форсунки'], money: 115 },
  { name: 'Двери', signatures: ['Ремкомплект ограничителей'], money: 116 },
  { name: 'Консоли в автомобиль', signatures: ['Ручки кондиционера'], money: 117 },
  { name: 'Запчасти для электросамокатов', signatures: ['Коврик в самокат'], money: 118 },
];

const main = async () => {
  const allCategories = await prisma.category.findMany();
  const unique_categories = [];

  for (const defaultCategory of defaultCategories) {
    if (!allCategories.find(({ name }) => name === defaultCategory.name)) {
      unique_categories.push(defaultCategories);
    }
  }

  if (unique_categories.length === 0) return allCategories;

  const categories = await prisma.category.createMany({
    data: unique_categories,
  });

  return categories;
};

main();

# Документация по проекту

1) auth -  endpoint'ы для auth
   1) /auth/hash - проверка hash от tg
   2) /auth/refresh - обновление refresh/acceess токенов
2) core - помощники всякие
   1) decorators:
      1) Auth - есть ли user_id в redis (GUARD)
      2) JwtAuth - проверка access token в headers (GUARD)
      3) Roles - проверка роли (GUARD)
      4) Token - получение access token в headers (DECORATOR)
   2) helpers - всякие вспомогательные алгоритмы и данные
   3) redis - все что нужно для редиса - сервис и keys
3) order - controller и service для приходящих продуктов и возвратов
4) user - controller и service для пользователей
5) ozon:
   1) ozon.images_service - получение изображений оп {артикулу, product_id, sku} (одному только)
   2) ozon.new_order - получение каждые OZON_PING_STEP новых заказов и добавление уникальных в бд (выдаются все за месяц)
   3) ozon.return - аналогично new_order но для возвратов
6) Самое важное - bot:
   1) admin
      1) bot.admin_approve - после регистрации приходит сообщение о подтвержении боссу. обработка actions
   2) boss
      1) boss - становление боссом с помощью секретной техники авторизации
   3) employee
      1) bot.employee - отвечает за обрабатывание новых заказов и возвратов. Здесь приходят новые заказы и возвраты, а также обрабатывается взятие заказа и действие "забрать со склада"
   4) templates - listManager - утилита которая помогает управляться шаблонно и систематически со всеми списками с кнопками "назад/вперед"
   5) scenes -
      1) Login, Register
      2) profiles:
         1) Admin - профиль + список с сотрудниками (listManager) - возможность редактировать их
         2) Employee - профиль + список заказов выполненных/в работе + /end_order (listManager)
         3) Boss - профиль + список Админов, сотрудников и неавторизованных пользователей + список выполненных, в работе заказов, возвратов (listManager) + редактирование всего
   6) bot.help - /help для всех со всеми командами
   7) bot.profile - распределение /profile для всех ролей (то есть реализация в папке scenes/profile)
   8) bot.service - /start и команды /register, /login, /logout

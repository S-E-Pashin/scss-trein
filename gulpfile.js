//Старый подход но более наглядный(кажется)
"use strict";
var gulp = require("gulp"); /*Создаю переменную и передаю в нее модуль под названием gulp*/
var plumber = require("gulp-plumber");
var sourcemap = require("gulp-sourcemaps");
var scss = require("gulp-sass"); /*Использую я gulp-sass а работаю с файлами scss*/
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var csso = require("gulp-csso");
var rename = require("gulp-rename");
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var svgstore = require("gulp-svgstore");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var del = require("del");
// Запуск библиотеки-механизма библиотеки gulp-less из библиотеки npm. Установлена в секцию разработчика devDependencies файла packaje.json.

gulp.task("css", function () {
    return gulp.src("source/scss/style.scss")  /*Найти файл по указанному пути*/ /*Ищу файл scss только зачем он мне нужен автор не говорит*//*todo Зачем мне искать и сохранять scss мне же нужно его преобразовывать.*/
      // Функция pipe - "труба" вбирает в себя значения от предыдущей задачи и (если есть последующая) передает в себе или последующей функции для обработки в соответствии с заложенным в них функционалом.
      .pipe(plumber()) /*//.pipe(plumber())-обработчик проверяющий препроцессорные файлы и информирующий о возникновении проблем но посредством него не ломается сборка.*/
      .pipe(sourcemap.init()) /*// Карта кода, эта команда получает исходное состояние.*/
      .pipe(scss()) /*// scss() - Собирает scss файлы в единый css файл.*/
      .pipe(postcss([ /*// .pipe(postcss([- Библиотека-механизм со своими внутренними библиотеками.*/
          autoprefixer() /*// Автопрефиксер. - Составная часть библиотеки postcss. Ставит префиксы. Обрабатывает полученный css и добавляет необходимые префиксы.*/
      ]))
      .pipe(rename("style.css")) /*Создаю/переназываю не минифицированный файл со стилями*/
      .pipe(gulp.dest("build/css")) /*Сохраняю не минифицированный файл в папку build/css*/
      .pipe(csso()) /*// МИНИФИКАЦИЯ файла css*/
      .pipe(rename("style.minНИка.css")) /*// Изменение имени файла на указанный.*/
      .pipe(sourcemap.write(".")) /*// Карта кода, получает обработанное состояние. Сравнивает с исходным состоянием.*/
      .pipe(gulp.dest("build/css")) /*// dest помести данные файлы в следующую папку по такому адресу.*/
      .pipe(server.stream());
});

gulp.task("server", function () { /*Задача создания сервера*/
    server.init({
        server: "build/" /*Адрес нахождения файлов для создания сервера*/
    });
  /*// Указание файлов для наблюдения-контроля состояния. Найди в указанной папке и всех подпапках файлы с сширением .less и как только в них произойдет изменение выполни следующую задачу - series("css").*/
    gulp.watch("source/scss/**/*.scss", gulp.series("css", "refresh")); /*gulp.watch - следить и выполнить слудующую задачу при изменении отслеживаемых файлов gulp.series - выполнять следующие задачи-задачу css и задачу по перезагрузке сервера/для перезагрузки страницы*/
    gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html", "refresh"));
    gulp.watch("source/*.html", gulp.series("html", "refresh"));
    gulp.watch("source/js/**/*.js", gulp.series("html", "refresh"));
});

gulp.task("refresh", function (done) { /*Перезагрузка сервера*/
    server.reload();
    done();
});

gulp.task("images", function () { /*Оптимизация изображения*/
    return gulp.src("source/img/**/*.{png,jpg,svg}") /*на любой вложенности найти файлы с такими расширениями*/
      .pipe(imagemin([ /*Запускаем библиотеку оптимизации изображений.*/
          imagemin.optipng({
              optimizationLevel: 3 /*Это свойство значит - сколько раз optipng осуществит прогонов оптимизации - проверить уровень, время оптимизации и принять оптимальное решение можно с помощью полученного вместе с установкой node.js пакета npx(Дает возможность использовать пакеты без их установки.) посредством команды npx gulp images*/
          }),
          imagemin.jpegtran({ /*оптимизация jpеg. Это свойство постепенно-при загрузке-улучшает качество загружаемых изображений jpeg.*/
              progressive: true
          }),
          imagemin.svgo() /*отпимизация svg*/
      ]))

      .pipe(gulp.dest("source/img")) /*Сложит оптимизированные изображения TODO возможно лучше перекладывать оптимизированные изображения в папку build т.к. именно она будет находится/передаваться пользователю во время загрузки а раз так то возможно исходные файлы которые будут находится в это время в папке source лучше оставить в первозданном виде для возможности их корректного переиспользования в том случае если потребуется изменить оптимизацию изображений...*/
});

gulp.task("webp", function () {
    return gulp.src("source/img/**/*.{png,jpg}")
      .pipe(webp({ /*выполнить задачу преобразования в webp с получением 90% качества изображений.*/
          quality: 90
      }))
      .pipe(gulp.dest("build/img"));
});

gulp.task("sprite", function () { /*Создание спрайта из svg файлов которые находятся в папке source. Использование данных изображений будет возможно через <svg><use xlink:href=""></use></svg> точно так же как и инлайновыми svg*/
    return gulp.src("source/img/{logo-*.svg,icon-*.svg}") /*Ищем все иконки svg с указанными суффиксами*/
      .pipe(svgstore({
          inlineSvg: true
      }))
      .pipe(rename("sprite.svg")) /*Переназываем/пересоздаем файл  sprite.svg*/
      .pipe(gulp.dest("build/img")); /*Размещаем спрайт в папке build*/
});
/* TODO разобраться/вспомнить posthtml.include +
Задача для HTML: Взять файл и добавить в указанное место в разметке. Для выполнения этой задачи необходим плагин posthtml-include. Этот плагин добавит новый тег в HTML, тег - include.В разметке Нужно обернуть спрайт в тег <div style="display: none"><include src="build/img/sprite.svg"></include></div>
// После необходимо запустить сборку спрайта и его вставку в html командой - npx gulp sprite && npx gulp html*/
gulp.task("html", function () {
    return gulp.src("source/*.html") /*Находит html файлы проекта*/
      .pipe(posthtml([
          include()
      ]))
      .pipe(gulp.dest("build"));
});

gulp.task("copy", function () { /*Копирование*/
    return gulp.src([
        "source/fonts/**/*.{woff, woff2}",
        "source/img/**",
        "source/js/**",
        "source/*.ico"
    ], {
        base: "source"
    })
      .pipe(gulp.dest("build"));
});

gulp.task("clean", function() { /*Функция для удаления папки build для ее работы была прописано в package.json в "devDependencies": {"del": "^5.1.0"} и указано в  gulpfile.js var del = require("del"); а после запущена npm i для доустановки данного пакета в проект.*/
    return del("build");
});

gulp.task("build", gulp.series(
  "clean",
  "copy",
  "webp",
  "css",
  "sprite",
  "html"
));

gulp.task("start", gulp.series(
  "build",
  "server"
));

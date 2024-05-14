let game = {
    //Данные игрового поля
    width: 1000,
    height: 700,
    ctx: undefined,


    //Переменные для центра карты
    centerX: undefined,
    centerY: undefined,


    //Данные еды
    food_width: 900,
    food_height: 675,


    foodScalar: 0.04,
    cntFoods: 0,
    foods: [],

    //При изменения размера змеи нужно применять зум (увеличение наблюдаемого поля)
    rendering_scalar: 1,


    //Переменные для инициализация змеи
    init_radius: 15,
    init_length: 100,
    init_mass: 5,
    init_distance: 17,
    init_speed: 0.2,
    

    //Текущие данные змеи
    //Изменение длины змеи взял при анализе реальных величин, таких как масса, длина, площадь сечения
    //Поэтому при изменении массы змеи, другие переменные буду изменять относительно этого изменения
    //Таким образом, у нас будет симулятор роста змеи
    radius: undefined,
    length: undefined,
    mass: undefined,
    distance: undefined,
    cntCircles: undefined,

    //Скорость змеи
    speed: undefined,

    //Направление движения змеи (единичный вектор)
    direction: {
        dx: 1.0,
        dy: 0.0
    },
    
    //Массив для записи данных о корпусах змеи
    slithers: [],

    //Переменные для отслеживания количества кадров и времени, прошедшего между кадрами
    //Что-то наподобие deltaTime из unity
    frame: 0,
    previousFrameTime: performance.now(),

    //Спрайты для отрисовки
    sprites: {
        background: undefined,
        food: undefined
    },

    init: function(){
        //Точка, в которой будет рисоваться голова змеи
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        this.radius = this.init_radius;
        this.distance = this.init_distance;
        this.mass = this.init_mass;
        this.length = this.init_length;
        this.speed = this.init_speed;


        //Получение объекта canvas
        let canvas = document.getElementById("canvas");

        //Установка слушателя для перемещения мышки, которая будет обновлять направление от центра canvas до мышки и запишет в direction
        canvas.addEventListener("mousemove", function (event) {
            var rect = canvas.getBoundingClientRect();
            
            var x = event.clientX - rect.left - game.centerX;
            var y = event.clientY - rect.top - game.centerY;

            var dir = normalizeVector([x, y]);

            game.direction.dx = dir[0];
            game.direction.dy = dir[1];
        });

        //Установка контекста для рисования
        this.ctx = canvas.getContext("2d");

        //Установка шрифта по умолчанию
        this.ctx.font = "30 px Arial";
    },

    load: function() {
        //Создание изображения и установка для него пути
        for (let key in this.sprites){
            this.sprites[key] = new Image();
            this.sprites[key].src = "images/" + key + ".png";
        }
    },

    create: function(){
        //Определения количества корпусов относительно реальной длины (length), чтобы они были равны
        this.cntCircles = Math.round((this.init_length - 2 * this.init_radius) / (this.init_distance * 2)) + 1;

        //Добавление корпусов
        for (var i = 0; i < this.cntCircles; i++) {
            this.slithers.push({
                x: this.centerX - i * this.init_distance,
                y: this.centerY,
            });
        }


        //Добавление еды
        this.cntFoods = 100;
        for (var i = 0; i < this.cntFoods; i++) {
            this.foods.push({
                x: Math.random() * this.width * 2,
                y: Math.random() * this.height * 2,
                scalar: this.foodScalar
            });
        }
    },

    start: function() {
        this.init();
        this.load();
        this.create();
        this.run();
    },

    render: function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        //Отрисовка фона
        this.ctx.drawImage(this.sprites.background, 0, 0, this.width, this.height);

        
        //Вывод очков
        this.ctx.fillStyle = "white"
        this.ctx.fillText("Score:" + this.frame, 15, this.height - 15);
        

        //Голову змеи будем распологать в центре канваса, чтобы было ощущение симулятора
        //Переменные для перемещения всех объектов относительно головы
        let dx = this.centerX - this.slithers[0].x;
        let dy = this.centerY - this.slithers[0].y;


        //Отрисовка еды
        this.foods.forEach(element => {
            this.ctx.drawImage(this.sprites.food, 
                Math.round(this.centerX - (this.centerX -  (element.x + dx)) / this.rendering_scalar), 
                Math.round(this.centerY - (this.centerY - (element.y + dy)) / this.rendering_scalar), 
                this.food_width * element.scalar, this.food_height * element.scalar);
        });


        //Отрисовка змеи(слизня) с применением перемещения
        this.slithers.forEach(element => {
            this.ctx.beginPath();
            this.ctx.arc(this.centerX - (this.centerX -  (element.x + dx)) / this.rendering_scalar, this.centerY - (this.centerY - (element.y + dy)) / this.rendering_scalar, this.radius / this.rendering_scalar, 0, 2 * Math.PI);
            this.ctx.fillStyle = 'green';
            this.ctx.fill();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = "black";
            this.ctx.stroke();
        });

        
    },

    update: function(deltaTime){
        //Придание скорости голове
        this.slithers[0].x += this.direction.dx * deltaTime * this.speed;
        this.slithers[0].y += this.direction.dy * deltaTime * this.speed;

        //Движение тела змеи
        for (let i = 1; i < this.cntCircles; i++) {
            //Нормализация других отделов, чтобы они поспевали за головой

            //Направление от предыдущего корпуса тела змеи к следующему
            let dir = normalizeVector([this.slithers[i - 1].x - this.slithers[i].x, this.slithers[i - 1].y - this.slithers[i].y])

            //Получения фактического расстояния между корпусами
            real_distance = get_distance([this.slithers[i - 1].x, this.slithers[i - 1].y], [this.slithers[i].x, this.slithers[i].y]);

            //Коэффициент изменения скорости, в зависимости от того ближе или дальше находится текущий корпус, чем должен быть
            let k = (real_distance / this.distance);

            //Придание скорости текущему корпусу
            this.slithers[i].x += dir[0] * k * deltaTime * this.speed;
            this.slithers[i].y += dir[1] * k * deltaTime * this.speed;
        }

    },



    run: function() {
        //Обновление текущего времени и предыдущего, а так же передача промежутка времени в функцию update
        let currentFrameTime = performance.now();
        let deltaTime = currentFrameTime - this.previousFrameTime;
        this.previousFrameTime = currentFrameTime;


        //Может быть потом понадобится
        this.frame += 1;
 

        //Если нужно быстро увидеть динамику роста змеи, то можно включить эту опцию
        //this.mass += Math.round(this.frame % 120 / 40);



        //Обновление метрических данных змеи
        this.updateSlizer();


        //Обновление данных объектов и перерисовка
        this.update(deltaTime);
        this.eat();
        this.render();

        
        //Анимация изменения времени
        window.requestAnimationFrame(function () {
            game.run();
        })
    },

    //Обновление параметром змеи
    updateSlizer: function() {
        //Задание новые параметров змеи, относительно начальных
        //Параметры находятся в таком отношении, что объем тела пропорционален массе
        this.length = this.init_length * Math.pow(this.mass / this.init_mass, 0.7);
        this.radius = this.init_radius * Math.pow(this.mass / this.init_mass, 0.15);
        this.distance = this.init_distance * Math.pow(this.mass / this.init_mass, 0.15);
        new_cnt_Circles = Math.round((this.length - 2 * this.radius) / (this.distance * 2)) + 1;


        //Будет хорошо, если коэффициент выводимого изображения будет немного меньше, чем рост ширины змеи
        //Так мы будем видеть увеличение змеи, хоть и будет применятся зум
        this.rendering_scalar = Math.pow(this.mass / this.init_mass, 0.11);


        //Очевидно, что при возрасстании массы скорость тоже должна увеличиваться, хоть и не так быстро, чем рост ширины змеи
        this.speed = this.init_speed * Math.pow(this.mass / this.init_mass, 0.12);


        //В случае, если количество корпусов нужно увеличить
        if (new_cnt_Circles > this.cntCircles) {
            for (let _ = 0; _ < new_cnt_Circles - this.cntCircles; _++) {
                //Координаты нового корпуса будут равны координатам последнего корпуса
                //Рано или поздно он встанет на свое место
                last_element = this.slithers[this.slithers.length - 1];
                this.slithers.push({
                    x: last_element.x,
                    y: last_element.y,
                });
            }

            this.cntCircles = new_cnt_Circles;
        } //Если количество корпусов нужно уменьшить
        else if (new_cnt_Circles < this.cntCircles) {
            for (let _ = 0; _ < this.cntCircles - new_cnt_Circles; _++) {
                this.slithers.pop();
            }

            this.cntCircles = new_cnt_Circles;
        }
    },


    eat: function() {
        head = this.slithers[0];


        for (let i = this.foods.length - 1; i >= 0; i--) {
            if (get_distance([head.x, head.y], [this.foods[i].x + this.foods[i].scalar * this.food_width / 2, this.foods[i].y + this.foods[i].scalar * this.food_height / 2]) < this.radius + this.foods[i].scalar * this.food_width / 2) {
                this.cntFoods -= 1;
                this.mass += this.foods[i].scalar * this.foods[i].scalar * 100;
                this.foods.splice(i, 1);
            }
          }
    }
}


//Добавление слушателя для запуска игры
window.addEventListener("load", function (){
    game.start();
})

//Нормализация вектора
function normalizeVector([dx, dy]) {
    const length = Math.sqrt(dx * dx + dy * dy);
    return [dx / length, dy / length];
}

//Функция для получения расстояние между точками
function get_distance([x1, y1], [x2, y2]) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

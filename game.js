// Змея как отдельный объект
let snake = {
    centerX: undefined,
    centerY: undefined,

    init_radius: 15,
    init_length: 100,
    init_mass: 5,
    init_distance: 17,
    init_speed: 0.2,
    rendering_scalar: 1,

    radius: undefined,
    length: undefined,
    mass: undefined,
    distance: undefined,
    cntCircles: undefined,
    speed: undefined,
    direction: {
        dx: 1.0,
        dy: 0.0
    },
    slithers: [],

    food_height: undefined,
    food_width: undefined,

    init: function(centerX, centerY, food_height, food_width) {
        this.centerX = centerX,
        this.centerY = centerY,
        this.radius = this.init_radius;
        this.distance = this.init_distance;
        this.mass = this.init_mass;
        this.length = this.init_length;
        this.speed = this.init_speed;
        this.cntCircles = Math.round((this.init_length - 2 * this.init_radius) / (this.init_distance * 2)) + 1;


        this.food_height = food_height;
        this.food_width = food_width;

        for (var i = 0; i < this.cntCircles; i++) {
            this.slithers.push({
                x: centerX - i * this.init_distance,
                y: centerY,
            });
        }
    },

    update: function(deltaTime) {
        this.updateSnakeMetrics();

        this.slithers[0].x += this.direction.dx * deltaTime * this.speed;
        this.slithers[0].y += this.direction.dy * deltaTime * this.speed;


        for (let i = 1; i < this.cntCircles; i++) {
            let dir = normalizeVector([this.slithers[i - 1].x - this.slithers[i].x, this.slithers[i - 1].y - this.slithers[i].y]);
            let real_distance = get_distance([this.slithers[i - 1].x, this.slithers[i - 1].y], [this.slithers[i].x, this.slithers[i].y]);
            let k = (real_distance / this.distance);

            this.slithers[i].x += dir[0] * k * deltaTime * this.speed;
            this.slithers[i].y += dir[1] * k * deltaTime * this.speed;
        }
    },

    updateSnakeMetrics: function() {
        this.length = this.init_length * Math.pow(this.mass / this.init_mass, 0.7);
        this.radius = this.init_radius * Math.pow(this.mass / this.init_mass, 0.15);
        this.distance = this.init_distance * Math.pow(this.mass / this.init_mass, 0.15);
        new_cnt_Circles = Math.round((this.length - 2 * this.radius) / (this.distance * 2)) + 1;

        this.speed = this.init_speed * Math.pow(this.mass / this.init_mass, 0.12);

        this.rendering_scalar = Math.pow(this.mass / this.init_mass, 0.11);

        if (new_cnt_Circles > this.cntCircles) {
            for (let _ = 0; _ < new_cnt_Circles - this.cntCircles; _++) {
                let last_element = this.slithers[this.slithers.length - 1];
                this.slithers.push({
                    x: last_element.x,
                    y: last_element.y,
                });
            }
            this.cntCircles = new_cnt_Circles;
        } else if (new_cnt_Circles < this.cntCircles) {
            for (let _ = 0; _ < this.cntCircles - new_cnt_Circles; _++) {
                this.slithers.pop();
            }
            this.cntCircles = new_cnt_Circles;
        }
    },

    eat: function(foods) {
        let head = this.slithers[0];
        for (let i = foods.length - 1; i >= 0; i--) {
            if (get_distance([head.x, head.y], [foods[i].x + foods[i].scalar * this.food_width / 2, foods[i].y + foods[i].scalar * this.food_height / 2]) < this.radius + foods[i].scalar * this.food_width / 2) {
                this.mass += foods[i].scalar * foods[i].scalar * 100;
                foods.splice(i, 1);
            }
        }
    },

    render: function(dx, dy, ctx) {
        this.slithers.forEach(element => {
            ctx.beginPath();
            ctx.arc(this.centerX - (this.centerX - (element.x + dx)) / this.rendering_scalar, this.centerY - (this.centerY - (element.y + dy)) / this.rendering_scalar, this.radius / this.rendering_scalar, 0, 2 * Math.PI);
            ctx.fillStyle = 'green';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "black";
            ctx.stroke();
        });
    }

};

// Игра как отдельный объект
let game = {
    width: 1000,
    height: 700,
    ctx: undefined,
    centerX: undefined,
    centerY: undefined,
    food_width: 900,
    food_height: 675,
    foodScalar: 0.04,
    cntFoods: 0,
    foods: [],
    rendering_scalar: 1,
    frame: 0,
    previousFrameTime: performance.now(),
    sprites: {
        background: undefined,
        food: undefined
    },

    init: function() {
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        let canvas = document.getElementById("canvas");
        canvas.addEventListener("mousemove", (event) => {
            var rect = canvas.getBoundingClientRect();
            var x = event.clientX - rect.left - this.centerX;
            var y = event.clientY - rect.top - this.centerY;
            var dir = normalizeVector([x, y]);
            snake.direction.dx = dir[0];
            snake.direction.dy = dir[1];
        });

        this.ctx = canvas.getContext("2d");
        this.ctx.font = "30px Arial";
        snake.init(this.centerX, this.centerY, this.food_height, this.food_width);
    },

    load: function() {
        for (let key in this.sprites) {
            this.sprites[key] = new Image();
            this.sprites[key].src = "images/" + key + ".png";
        }
    },

    create: function() {
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
        this.ctx.drawImage(this.sprites.background, 0, 0, this.width, this.height);
        this.ctx.fillStyle = "white";
        this.ctx.fillText("Score:" + this.frame, 15, this.height - 15);

        let dx = this.centerX - snake.slithers[0].x;
        let dy = this.centerY - snake.slithers[0].y;


        this.foods.forEach(element => {
            this.ctx.drawImage(this.sprites.food, 
                Math.round(this.centerX - (this.centerX -  (element.x + dx)) / this.rendering_scalar), 
                Math.round(this.centerY - (this.centerY - (element.y + dy)) / this.rendering_scalar), 
                this.food_width * element.scalar / this.rendering_scalar, this.food_height * element.scalar / this.rendering_scalar);
        });

        snake.render(dx, dy, this.ctx);
    },

    update: function(deltaTime) {
        snake.update(deltaTime);
        snake.eat(this.foods);

        this.rendering_scalar = snake.rendering_scalar;
    },

    run: function() {
        let currentFrameTime = performance.now();
        let deltaTime = currentFrameTime - this.previousFrameTime;
        this.previousFrameTime = currentFrameTime;
        this.frame += 1;


        this.update(deltaTime);
        this.render();

        window.requestAnimationFrame(() => {
            this.run();
        });
    }
};

window.addEventListener("load", function() {
    game.start();
});

function normalizeVector([dx, dy]) {
    const length = Math.sqrt(dx * dx + dy * dy);
    return [dx / length, dy / length];
}

function get_distance([x1, y1], [x2, y2]) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}
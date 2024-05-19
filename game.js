let slither = {
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
        this.updateSlitherMetrics();

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

    updateSlitherMetrics: function() {
        this.length = this.init_length * Math.pow(this.mass / this.init_mass, 0.7);
        this.radius = this.init_radius * Math.pow(this.mass / this.init_mass, 0.15);
        this.distance = this.init_distance * Math.pow(this.mass / this.init_mass, 0.15);
        new_cnt_Circles = Math.round((this.length - 2 * this.radius) / (this.distance * 2)) + 1;

        this.speed = this.init_speed * Math.pow(this.mass / this.init_mass, 0.12);



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
        for (let i = foods.items.length - 1; i >= 0; i--) {
            if (get_distance([head.x, head.y], [foods.items[i].x + foods.items[i].scalar * this.food_width / 2, foods.items[i].y + foods.items[i].scalar * this.food_height / 2]) < this.radius + foods.items[i].scalar * this.food_width / 2) {
                this.mass += foods.items[i].scalar * foods.items[i].scalar * 1000;
                foods.items.splice(i, 1);
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

// Еда как отдельный объект
let foods = {
    items: [],
    foodScalar: 0.04,
    food_width: 900,
    food_height: 675,

    create: function(width, height, cntFoods) {
        this.items = [];
        for (var i = 0; i < cntFoods; i++) {
            this.items.push({
                x: Math.random() * width * 2,
                y: Math.random() * height * 2,
                scalar: this.foodScalar
            });
        }
    },

    render: function(dx, dy, ctx, centerX, centerY, rendering_scalar, sprite) {
        if (this.items.length == 0) {
            game.game_over(true);
        }

        this.items.forEach(element => {
            ctx.drawImage(sprite, 
                Math.round(centerX - (centerX - (element.x + dx)) / rendering_scalar), 
                Math.round(centerY - (centerY - (element.y + dy)) / rendering_scalar), 
                this.food_width * element.scalar / rendering_scalar, this.food_height * element.scalar / rendering_scalar);
        });
    }
};


// Еда как отдельный объект
let comets = {
    width: undefined,
    height: undefined,
    items: [],
    comet_radius: 450,
    max_comets: undefined,
    alpha_step_min: 0.001,
    alpha_step_max: 0.0015,

    // Для вызова какой-либо функции с определенной частотой
    lastTime: 0,
    interval: 100,
    id_isCommetHit: undefined,

    
      

    create: function(max_comets, width, height) {
        this.width = width;
        this.height = height;
        this.max_comets = max_comets;
        

        this.items = [];
        for (var i = 0; i < this.max_comets; i++) {
            this.items.push({
                x: Math.random() * width * 2,
                y: Math.random() * height * 2,
                alpha: 0,
                alpha_step: Math.random() * (this.alpha_step_max - this.alpha_step_min) + this.alpha_step_min,
                scalar: Math.random()
            });
        }

        this.id_isCommetHit = setInterval(this.isCommetHit, this.interval);
    },

    isCommetHit: function() {
        for (let i = comets.items.length - 1; i >= 0; i--) {
            for (var j = 0; j < slither.slithers.length; j++) {
                let dist = get_distance([comets.items[i].x, comets.items[i].y], [slither.slithers[j].x, slither.slithers[j].y]);
                let sum_radius = comets.comet_radius * comets.items[i].scalar + slither.radius;


                if (dist < sum_radius && comets.items[i].alpha > 0.5)
                {
                    flag = true;
                    clearInterval(this.id_isCommetHit);
                    game.game_over(false);
                    
                    
                }
            }
        }
    },

    update: function() {
        while (this.max_comets > this.items.length) {
            this.items.push({
                x: Math.random() * this.width * 2,
                y: Math.random() * this.height * 2,
                alpha: 0,
                alpha_step: Math.random() * (this.alpha_step_max - this.alpha_step_min) + this.alpha_step_min,
                scalar: Math.random()
            });
        }

        this.items.forEach(element => {
            element.alpha += element.alpha_step;
        });

        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].alpha > 0.7) {
                this.items.splice(i, 1);
            }
        }
    },

    render: function(dx, dy, ctx, centerX, centerY, rendering_scalar) {
        this.items.forEach(element => {
            ctx.beginPath();

            if (element.alpha > 0.5) {
                ctx.fillStyle = 'red';
            }
            else {
                ctx.fillStyle = 'yellow';
            }
            ctx.globalAlpha = element.alpha;
            ctx.arc(centerX - (centerX - (element.x + dx)) / rendering_scalar, centerY - (centerY - (element.y + dy)) / rendering_scalar, this.comet_radius * element.scalar / rendering_scalar, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1.0;
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
    cntFoods: 100,
    rendering_scalar: 1,

    is_game_over: false,
    frame: 0,
    previousFrameTime: performance.now(),

    sounds: {
        background: undefined,
        gameOver: undefined
    },


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
            slither.direction.dx = dir[0];
            slither.direction.dy = dir[1];
        });

        this.ctx = canvas.getContext("2d");
        this.ctx.font = "30px Arial";
        foods.create(this.width, this.height, this.cntFoods);
        slither.init(this.centerX, this.centerY, foods.food_height, foods.food_width);
        comets.create(7, this.width, this.height);
    },

    load: function() {
        for (let key in this.sprites) {
            this.sprites[key] = new Image();
            this.sprites[key].src = "images/" + key + ".png";
        }

        this.sounds.background = new Audio("sounds/background.mp3");
    },

    start: function() {
        this.init();
        this.load();
        

        this.sounds.background.loop = true;
        this.sounds.background.play();
        this.run();
    },

    render: function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.sprites.background, 0, 0, this.width, this.height);
        this.ctx.fillStyle = "white";
        this.ctx.fillText("Mass:" + (slither.mass * 100).toFixed(), 15, this.height - 15);

        let dx = this.centerX - slither.slithers[0].x;
        let dy = this.centerY - slither.slithers[0].y;

        foods.render(dx, dy, this.ctx, this.centerX, this.centerY, this.rendering_scalar, this.sprites.food);
        slither.render(dx, dy, this.ctx);
        comets.render(dx, dy, this.ctx, this.centerX, this.centerY, this.rendering_scalar);
    },

    update: function(deltaTime) {
        slither.update(deltaTime);
        slither.eat(foods);
        comets.update();

        this.rendering_scalar = slither.rendering_scalar;
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
        
    },

    game_over: function(flag) {
        if (!this.is_game_over) {
            this.is_game_over = true;
            alert("Игра окончена!");
            location.reload();
        }
    }
};


document.getElementById("start-button").addEventListener("click", function() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("game-container").style.display = "block";
    game.start();
});

function normalizeVector([dx, dy]) {
    const length = Math.sqrt(dx * dx + dy * dy);
    return [dx / length, dy / length];
}

function get_distance([x1, y1], [x2, y2]) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}
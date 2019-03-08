

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');
const Sequelize= require('sequelize');


/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log("Commandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
   /* model.getAll().forEach((quiz, id) => {
        log(` ${colorize(id, 'magenta')}:  ${quiz.question}`);
    });
    rl.prompt();*/

    models.quiz.findAll()
    .then(quizzes=>{
        quizzes.forEach((quiz)=>{log(`[${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`)});
    })
    .catch(error=>{
        errorlog(error.message);
    })
    .then(()=> {rl.prompt();})
};

const validateId= id=>{
    return new Sequelize.Promise((resolve,reject)=>{
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parametro ${id}.`));

        }else{
            id=parseInt(id);
            if(Number.isNaN(id)){
                reject(new Error( `El valor de este parametro ${id} no es un numero`));
            }else{
                resolve(id);
            }
        }

    })
}

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
    
    validateId(id)
    .then(id=> models.quiz.findById(id))
    .then(quiz=>{
        if(!quiz){
            throw new Error(`No existe ningun quiz con id=[${id}]`);
        }else{
            log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        }
    })
    .catch(error=>{
        errorlog(error.message);
    })
    .then(()=>{rl.prompt();})
};


/**
 * Añade un nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {
    makeQuestion(rl,'Introduce una pregunta: ')
    .then(s => {
        return makeQuestion(rl,'Introduce una respuesta: ')
        .then(p=>{
            log(s+""+p);
            return {question: s, answer: p};
        });
    })
    .then((quiz)=>{
        log(quiz);
        return models.quiz.create(quiz);
        
    })
    .then((quiz)=>{
        log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error=>{
        errorlog('El quiz es erroneo: ');
        error.errors.forEach(({message})=>errorlog(message));
    })
    .catch(error=>{
        errorlog(error.message);
    })
    .then(()=>{
        rl.prompt();
    }); 
};

const makeQuestion= (rl,text)=>{
    return new Sequelize.Promise((resolve,reject)=>{
            rl.question(colorize(text,'red'), answer=>{
            resolve(answer.trim());
        });
    });
}



/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
    validateId(id)
    .then(id=>{

        models.quiz.destroy({where:{id}});
    })
    .catch(error=>{
        errorlog(error.message);
    })
    .then(()=>{
    rl.prompt()});
};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {

    validateId(id)
    .then(id=> models.quiz.findById(id))
    .then(quiz=>{
        if(!quiz){
            throw new Error(`No existe el id: ${id}`);
        }
            process.stdout.isTTY && setTimeout(()=>{rl.write(quiz.question)},0);
        return makeQuestion(rl,'Introduzca una pregunta: ')
        .then(s=>{
            process.stdout.isTTY && setTimeout(()=>{rl.write(quiz.answer)},0);
            return makeQuestion(rl,'Introduzca una respuesta: ')
            .then(p=>{
                quiz.question=s;
                quiz.answer=p;
                return quiz;
            })
        })

    })
    .then(quiz=> {
        return quiz.save();
    })
    .then(quiz=>{
        log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${quiz.question}${colorize('=>', 'magenta')} ${quiz.answer}`);  
    })
    .catch(Sequelize.ValidationError, error=>{
        errorlog('El quiz es erroneo');
        error.errors.forEach(({message})=>errorlog(message));
    })
    .catch(error=>{
        errorlog(error.message);
    })
    .then(()=>{rl.prompt()});
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
   /* try{
        if(typeof id === "undefined"){
            throw new Error("Id vacio");
            rl.prompt();
        }
     
        
        const quiz = model.getByIndex(id);
    
        log(quiz.question,'red');
        
        rl.question(colorize('Introduce la respuesta: ','red'), answer=>{
                                                        if((answer.toLowerCase().trim())===(quiz.answer.toLowerCase().trim())){
                                                            log('Correcto','green');
                                                            rl.prompt();}
                                                        
                                                        else if(answer!==quiz.answer){
                                                            log('Incorrecto','red');
                                                            rl.prompt();}
                                                        
                                                        
        });
               
    }catch(Error){
        log(Error);
        rl.prompt();
    }*/
validateId(id)
.then(id=>{
    return models.quiz.findById(id);
})
.then(quiz=>{
    log(quiz.question,'red');
    return makeQuestion(rl,'Introduce una respuesta: ')
    .then(answer=>{
        if((answer.toLowerCase().trim())===(quiz.answer.toLowerCase().trim())){
            log('Correcto','green');
        }else{
            log('Incorrecto','red');
        }
    })
})
.catch(Sequelize.ValidationError, error=>{
    errorlog('El quiz es erroneo');
        error.errors.forEach(({message})=>errorlog(message));
})
.catch(error=>{
        errorlog(error.message);
})
.then(()=>{rl.prompt()});

};


/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = rl => {
    let quiz=[];

    const quizzes= model.getAll();
    quizzes.forEach(q=>quiz.push(q));

    let n=0; //numero de aciertos

    
    const play1=()=>{

        let i=Math.floor((Math.random()) * (quiz.length-1));

        log(quiz);

        log(i);
        if(quiz.length==0){
                    log('No hay nada más que preguntar.');
                    log(`Fin del juego. Puntucion=${n}`);
                    biglog(`${n}`,'green');                    
                    rl.prompt();
                
        }else{       

        rl.question(colorize(`¿${quiz[i].question}?`,'red'),answer=>{
            if((answer.toLowerCase().trim())===(quiz[i].answer.toLowerCase().trim())){
                quiz.splice(i,1);
                log(`CORRECTO - Lleva ${++n} aciertos.`)
                condition=true;                
                play1();
            }else{
                log(`Incorrecto.`);
                log(`Fin del juego. Puntucion=${n}`);
                condition=false;
                rl.prompt();
            }
        });
    }
}
play1();

};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('Luis de Pablo Beltrán', 'green');
    
    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};




const Sequelize= require("sequelize");

// Nombre del fichero donde se guardan las preguntas.
// Es un fichero de texto con el JSON de quizzes.

const sequelize= new Sequelize("sqlite:quizzes.sqlite", {logging:false});

sequelize.define('quiz',{
    question:{ 
        type: Sequelize.STRING,
        unique:{msg:"Ya existe esta pregunta" },
        validate:{notEmpty:{msg:"La pregunta no puede estar vacia"}}
    },
    answer:{
        type: Sequelize.STRING,
        validate:{notEmpty:{msg:"La respuesta no puede estar vacia"}}
    }
});

//sincronizacion
sequelize.sync()
.then(()=> sequelize.models.quiz.count())
.then(count => {
    if(!count){
        return sequelize.models.quiz.bulkCreate([
            {
                question: "Capital de Italia",
                answer: "Roma"
            },
            {
                question: "Capital de Francia",
                answer: "París"
            },
            {
                question: "Capital de España",
                answer: "Madrid"
            },
            {
                question: "Capital de Portugal",
                answer: "Lisboa"
            }
        ]);
    }

})
.catch(error =>{
    console.log(error);
});

module.exports=sequelize;


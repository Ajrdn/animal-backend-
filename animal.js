const API_KEY = require('./API_KEY.js')
const express = require('express')
const request = require('request')
const mysql = require('mysql2')
const dbconfig = require('./db-config.js')
const connection = mysql.createConnection(dbconfig)
const app = express()
const cors = require('cors')

const port = 8080
const pSize = 1000

app.use(cors())

app.get('/', (req, res) => {
  res.send('Animal API')
})

app.get('/getAnimalData/:id', (req, res) => {
  const id = req.params.id
  connection.query('SELECT * FROM animal WHERE abdn_id=?', [id], (err, results) => {
    if (err || results.length === 0) {
      console.log('Error getting animal.')
      res.status(500).send(err)
      return
    }
    console.log('Animal retrieved.')
    res.send(results[0])
  })
})

app.get('/getShelterData/:region', (req, res) => {
  const region = req.params.region
  connection.query(`SELECT * FROM shelter WHERE jurisd_inst_nm LIKE '%${region}'`, (err, results) => {
    if (err || results.length === 0) {
      console.log('Error getting shelter.')
      res.status(500).send(err)
      return
    }
    console.log('Shelter retrieved.')
    res.send(results)
  })
})

app.get('/getAnimalListData/newDate', (req, res) => {
  const dog = JSON.parse(req.query.dog)
  const cat = JSON.parse(req.query.cat)
  const etc = JSON.parse(req.query.etc)
  let query = 'SELECT * FROM animal ORDER BY pblanc_begin_de DESC'

  if(!dog && !cat && !etc) {
    res.send([])
    return
  } else if(dog && !cat && !etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%개%' ORDER BY pblanc_begin_de DESC"
  } else if(!dog && cat && !etc) { 
    query = "SELECT * FROM animal WHERE species_nm LIKE '%고양이%' ORDER BY pblanc_begin_de DESC"
  } else if(!dog && !cat && etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%기타축종%' ORDER BY pblanc_begin_de DESC"
  } else if(dog && cat && !etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%개%' OR species_nm LIKE '%고양이%' ORDER BY pblanc_begin_de DESC"
  } else if(!dog && cat && etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%고양이%' OR species_nm LIKE '%기타축종%' ORDER BY pblanc_begin_de DESC"
  } else if(dog && !cat && etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%개%' OR species_nm LIKE '%기타축종%' ORDER BY pblanc_begin_de DESC"
  }

  connection.query(query, (err, results) => {
    if (err || results.length === 0) {
      console.log('Error getting animal.')
      res.status(500).send(err)
      return
    }
    console.log('Animal retrieved.')
    res.send(results)
  })
})

app.get('/getAnimalListData/oldDate', (req, res) => {
  const dog = JSON.parse(req.query.dog)
  const cat = JSON.parse(req.query.cat)
  const etc = JSON.parse(req.query.etc)
  let query = 'SELECT * FROM animal ORDER BY pblanc_begin_de'

  if(!dog && !cat && !etc) {
    res.send([])
    return
  } else if(dog && !cat && !etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%개%' ORDER BY pblanc_begin_de"
  } else if(!dog && cat && !etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%고양이%' ORDER BY pblanc_begin_de"
  } else if(!dog && !cat && etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%기타축종%' ORDER BY pblanc_begin_de"
  } else if(dog && cat && !etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%개%' OR species_nm LIKE '%고양이%' ORDER BY pblanc_begin_de"
  } else if(!dog && cat && etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%고양이%' OR species_nm LIKE '%기타축종%' ORDER BY pblanc_begin_de"
  } else if(dog && !cat && etc) {
    query = "SELECT * FROM animal WHERE species_nm LIKE '%개%' OR species_nm LIKE '%기타축종%' ORDER BY pblanc_begin_de"
  }

  connection.query(query, (err, results) => {
    if (err || results.length === 0) {
      console.log('Error getting animal.')
      res.status(500).send(err)
      return
    }
    console.log('Animal retrieved.')
    res.send(results)
  })
})

app.get('/getShelterData', (req, res) => {
  connection.query('SELECT * FROM shelter', (err, results) => {
    if(err || results.length === 0) {
      console.log('Error getting shelter.')
      res.status(500).send(err)
      return
    }
    console.log('Shelter retrieved.')
    res.send(results)
  })
})

app.listen(port, () => {
  const options = {
    uri: 'https://openapi.gg.go.kr/AbdmAnimalProtect',
    qs: {
      key: API_KEY,
      type: 'json',
      pIndex: 1,
      pSize: pSize,
    },
  }

  request(options, (err, response, body) => {
    const animalData = JSON.parse(body)
    const shelters = {}

    for(let i = 0; i < pSize; i++) {
      const animal = animalData['AbdmAnimalProtect'][1]['row'][i]

      const abdn_id = animal['ABDM_IDNTFY_NO']
      const species_nm = animal['SPECIES_NM']
      const age_info = animal['AGE_INFO']
      const bdwgh_info = animal['BDWGH_INFO']
      let sex_nm = animal['SEX_NM']
      if(sex_nm === 'M') sex_nm = '♂'
      else if(sex_nm === 'F') sex_nm = '♀'
      else sex_nm = '⚲'
      const neut_yn = animal['NEUT_YN']
      const sfetr_info = animal['SFETR_INFO']
      const discvry_plc = animal['DISCVRY_PLC_INFO']
      const image_cours = animal['IMAGE_COURS']
      const pblanc_begin_de = animal['PBLANC_BEGIN_DE']
      const pblanc_end_de = animal['PBLANC_END_DE']

      let shter_id = 0
      const shter_nm = animal['SHTER_NM']
      const shter_telno = animal['SHTER_TELNO']
      const protect_plc = animal['PROTECT_PLC']
      const jurisd_inst_nm = animal['JURISD_INST_NM']

      if(Object.keys(shelters).includes(shter_nm)) {
        shter_id = shelters[shter_nm]
      } else {
        shter_id = Object.keys(shelters).length + 1
        shelters[shter_nm] = shter_id

        connection.query(
          'INSERT INTO shelter (shter_nm, shter_telno, protect_plc, jurisd_inst_nm) VALUES (?, ?, ?, ?)',
          [shter_nm, shter_telno, protect_plc, jurisd_inst_nm],
          (err, results) => {
            if(err || results.length === 0) {
              console.log(err)
              return
            }
            console.log('Shter created.')
          }
        )
      }

      connection.query(
        'INSERT INTO animal (abdn_id, species_nm, age_info, bdwgh_info, sex_nm, neut_yn, sfetr_info, discvry_plc, image_cours, pblanc_begin_de, pblanc_end_de, shter_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          abdn_id,
          species_nm,
          age_info,
          bdwgh_info,
          sex_nm,
          neut_yn,
          sfetr_info,
          discvry_plc,
          image_cours,
          pblanc_begin_de,
          pblanc_end_de,
          shter_id,
        ],
        (err, results) => {
          if(err || results.length === 0) {
            console.log(err)
            return
          }
          console.log('Animal created.')
        }
      )
    }

    console.log(`http://127.0.0.1:${port}`)
  })
})

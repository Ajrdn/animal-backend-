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

app.get('/getSponsorData', (req, res) => {
  connection.query('SELECT * FROM sponsor', (err, results) => {
    if(err || results.length === 0) {
      console.log('Error getting sponsor.')
      res.status(500).send(err)
      return
    }
    console.log('Sponsor retrieved.')
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

app.get('/getTotalAnimal', (req, res) => {
  res.send(pSize.toString())
})

app.get('/getDayTotalAnimal', (req, res) => {
  connection.query("SELECT DATE_FORMAT(pblanc_begin_de, '%m/%d') AS pblanc_begin_de, COUNT(*) AS count FROM animal GROUP BY pblanc_begin_de ORDER BY pblanc_begin_de", (err, results) => {
    if (err || results.length === 0) {
      console.log('Error getting animal.')
      res.status(500).send(err)
      return
    }
    console.log('Animal retrieved.')
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

    const sponsors = [
      {
        name: '매흐시',
        url: 'https://smartstore.naver.com/mer_ci',
        content: '수익금 20%, 유기동물 위해 후원됩니다. 당신의 따뜻한 마음이 세상을 위로합니다.',
        tag: '#유기동물_후원_반지 #유기견_후원_팔찌 #유기묘_기부_목걸이',
        image: 'https://image.idus.com/image/files/b8cc02f0ff1d479f896d9c7ed1eb2535.jpg',
      },
      {
        name: '마을과 고양이',
        url: 'https://villagencat.modoo.at/',
        content: '길고양이 후원 마을과 고양이. 고양이는 사랑입니다. 사람도 동물도 함께 건강하고 행복한 마을을 꿈꿉니다.',
        tag: '#길고양이_후원_스마트톡 #길고양이_후원_담요 #길고양이_후원_엽서',
        image: 'https://modo-phinf.pstatic.net/20191018_72/1571343240880KHhot_PNG/mosa8KtV0j.png?type=f320_320',
      },
      {
        name: '메종드오브젝트',
        url: 'https://smartstore.naver.com/ojtbusan',
        content: '사지 말고 사랑으로 입양하세요. 유기동물후원브랜드, 동물들에겐 많은 분들의 작은 손길이 필요합니다.',
        tag: '#유기견_후원_팔찌 #유기동물_코인_팔찌 #유기동물_실버_오픈링',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8FshxIViD1XGJxpV2P5NFlsYJ8x13OXkn-w&usqp=CAU',
      },
      {
        name: '기프트폴독',
        url: 'https://smartstore.naver.com/gjftfordog2022',
        content: '유기견 후원 액세서리 브랜드 Gift for Dog – 강아지를 위한 선물',
        tag: '#유기견_후원_써지컬팔찌 #유기견_후원_원석팔찌 #유기견_후원_목걸이',
        image: 'https://shop-phinf.pstatic.net/20220907_149/1662545840050dJykU_JPEG/a.jpg?type=w640',
      },
      {
        name: '메리골드',
        url: 'https://smartstore.naver.com/marigold_gongbang',
        content: '유기동물에게 행복을 전달하는 후원 악세서리 마켓 메리골드입니다.',
        tag: '#유기견_기부반지 #유기묘_기부반지',
        image: 'https://image.idus.com/image/files/c4c29ba4b16748b98c063c55550190fa.jpg',
      },
      {
        name: '베러프레젠트',
        url: 'https://smartstore.naver.com/wishpedia',
        content: '더 나은 현재를 선물해요. 유기동물 후원 브랜드 ‘Better Present’',
        tag: '#유기동물_후원_반지 #유기동물_후원_뺏지 #유기견_후원_목걸이',
        image: 'https://shop-phinf.pstatic.net/20210112_57/1610451100881KmTWJ_JPEG/596ae4d0-d2d4-424b-9ef2-5c874a2ca0b9.jpg?type=w640',
      },
      {
        name: '해나달',
        url: 'https://smartstore.naver.com/hannahdal',
        content: '따뜻한 마음으로 희망을 전달하겠습니다.',
        tag: '#유기견_후원_기부팔찌 #유기견_후원_반지 #유기견_후원_목걸이',
        image: 'https://shop-phinf.pstatic.net/20221113_276/1668316990475KmOVo_PNG/%C1%A6%B8%F1-%BE%F8%C0%BD-1.png?type=w640',
      },
      {
        name: '손, 잡아줄게',
        url: 'https://smartstore.naver.com/handofdonor',
        content: '당신의 따뜻한 마음을 전달합니다. 손, 잡아줄게',
        tag: '#후원_액세서리 #유기견_유기묘_후원_팔찌 #유기견_유기묘_후원_반지',
        image: 'https://image.idus.com/image/files/3770f279eb9e4817aca744e7e767c0e6.jpg',
      },
      {
        name: '우리가 지켜줄 개',
        url: 'https://smartstore.naver.com/woojigae',
        content: '“우리가 지켜줄 게” 유기동물을 위한 착한 소비에 동참해주세요.',
        tag: '#유기동물_후원_반지 #유기동물_후원_그립톡',
        image: 'https://shop-phinf.pstatic.net/20211110_206/1636510762728CpgpP_PNG/%C1%A6%B8%F1%C0%BB-%C0%D4%B7%C2%C7%D8%C1%D6%BC%BC%BF%E4_-001_%283%29.png?type=w640',
      },
    ]

    for(let i = 0; i < sponsors.length; i++) {
      connection.query(
        'INSERT INTO sponsor (sponsor_name, url, content, tag, image) VALUES (?, ?, ?, ?, ?)',
        [sponsors[i].name, sponsors[i].url, sponsors[i].content, sponsors[i].tag, sponsors[i].image],
        (err, results) => {
          if(err || results.length === 0) {
            console.log(err)
            return
          }
          console.log('Sponsor created.')
        }
      )
    }

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

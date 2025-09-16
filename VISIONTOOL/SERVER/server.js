const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');
const { log } = require('console');


const app = express();
app.use(cors());

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.')); // .은 경로

const config = {
  user: 'SYSTEM',
  password: 'test1234',
  connectString: 'localhost:1522/xe'
};

// Oracle 데이터베이스와 연결을 유지하기 위한 전역 변수
let connection;

// 데이터베이스 연결 설정
async function initializeDatabase() {
  try {
    connection = await oracledb.getConnection(config);
    console.log('Successfully connected to Oracle database');
  } catch (err) {
    console.error('Error connecting to Oracle database', err);
  }
}

initializeDatabase();

// 엔드포인트
app.get('/', (req, res) => {
  res.send('Hello World');
});



app.get('/emp/delete', async (req, res) => {
  const { empNo } = req.query;

  try {
    await connection.execute(
      // `INSERT INTO STUDENT (STU_NO, STU_NAME, STU_DEPT) VALUES (${stuNo}, '${name}', '${dept}')`,
      `DELETE FROM EMP WHERE EMPNO = :empNo`,
      [empNo],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/tools/login', async (req, res) => {
  const { userId, userPsd } = req.query;
  try {
    const result = await connection.execute(
      `SELECT * FROM TOOL_USERS WHERE USER_ID = '${userId}' AND PASSWORD = '${userPsd}'`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/tools/checkid', async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await connection.execute(
      `SELECT * FROM TOOL_USERS WHERE USER_ID = '${userId}'`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/tools/join', async (req, res) => {
  const { userId, userPsd, userEmail, userName, userPhone, userAddr, userDetailAddr } = req.query;
  let Addr = userAddr + " " + userDetailAddr;
  
  try {
    await connection.execute(
      `INSERT INTO TOOL_USERS VALUES(:userId, :userEmail, :userPsd, :userName, :userPhone, :Addr, `
      + `SYSDATE, SYSDATE, 'U')`,
      [userId, userEmail, userPsd, userName, userPhone, Addr],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/tools/user/update', async (req, res) => {
  const { PASSWORD, EMAIL, USERNAME, PHONE_NUMBER, ADDRESS, USER_ID, userDetailAddr } = req.query;
  console.log(userDetailAddr);
  
  let addr = ADDRESS + " " + userDetailAddr;
  console.log(addr);
  
  try {
    await connection.execute(
      `UPDATE TOOL_USERS SET `
      + `PASSWORD = :PASSWORD, EMAIL = :EMAIL, USERNAME = :USERNAME, `
      + `PHONE_NUMBER = :PHONE_NUMBER, ADDRESS = :addr, UDATETIME = SYSDATE `
      + `WHERE USER_ID = :USER_ID`,
      [PASSWORD, EMAIL, USERNAME, PHONE_NUMBER, addr, USER_ID],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/tools/order/list', async (req, res) => {
  const { pageSize, offset } = req.query;
  
  try {
    const result = await connection.execute(
      `SELECT O.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TOOL_ORDERS O `
      + `ORDER BY CDATETIME DESC `
      + `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });

    const count = await connection.execute(
      `SELECT COUNT(*) FROM TBL_BOARD`
    );
    
    
    // 리턴
    res.json({
        result : "success",
        boardList : rows,
        count : count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/tools/qna/list', async (req, res) => {
  const { pageSize, offset } = req.query;
  
  try {
    const result = await connection.execute(
      `SELECT * FROM TOOL_QNA `
      + `ORDER BY CDATETIME DESC `
      + `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });

    const count = await connection.execute(
      `SELECT COUNT(*) FROM TBL_BOARD`
    );
    
    
    // 리턴
    res.json({
        result : "success",
        boardList : rows,
        count : count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/tools/product/insert', async (req, res) => {
  const { productId, productName, description, price, stock, type } = req.query;
  
  
  try {
    await connection.execute(
      `INSERT INTO TOOL_PRODUCTS VALUES(:product, :productName, `
      + `:price, :stock, SYSDATE, SYSDATE, :type, :description)`,
      [productId, productName, price, stock, type, description],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/tools/product/list', async (req, res) => {
  const { pageSize, offset } = req.query;
  
  try {
    const result = await connection.execute(
      `SELECT * FROM TOOL_PRODUCTS `
      + `ORDER BY UDATETIME DESC `
      + `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });

    const count = await connection.execute(
      `SELECT COUNT(*) FROM TBL_BOARD`
    );
    
    
    // 리턴
    res.json({
        result : "success",
        boardList : rows,
        count : count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/tools/product/info', async (req, res) => {
  const { productId } = req.query;
  try {
    const result = await connection.execute(
      `SELECT * FROM TOOL_PRODUCTS WHERE PRODUCT_ID = '${productId}'`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/tools/img/insert', async (req, res) => {
  const { img, productId } = req.query;
  
  
  try {
    await connection.execute(
      `INSERT INTO TOOL_IMG VALUES(TOOL_IMG_SEQ.NEXTVAL, 'main', `
      + `:img , :productId, NULL)`,
      {img, productId},
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});


app.get('/tools/product/img/info', async (req, res) => {
  const { productId } = req.query;
  try {
    const result = await connection.execute(
      `SELECT * FROM TOOL_IMG WHERE PRODUCT_ID = ${productId}`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        info : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/tools/product/update', async (req, res) => {
  const { PRODUCT_ID, PRODUCT_NAME, PRICE, STOCK, TYPE, DESCRIPTION } = req.query;
  console.log(PRODUCT_ID);
  console.log(PRODUCT_NAME);
  console.log(PRICE);
  console.log(STOCK);
  console.log(TYPE);
  console.log(DESCRIPTION);
  
  
  try {
    await connection.execute(
      `UPDATE TOOL_PRODUCTS SET `
      +`PRODUCT_NAME = :PRODUCT_NAME, PRICE = :PRICE, STOCK = :STOCK, `
      +`UDATETIME = SYSDATE, TYPE = :TYPE, DESCRIPTION = :DESCRIPTION `
      +`WHERE PRODUCT_ID = :PRODUCT_ID`,
      [ PRODUCT_NAME, PRICE, STOCK, TYPE, DESCRIPTION, PRODUCT_ID],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/tools/product/img/update', async (req, res) => {
  const { PRODUCT_ID, img } = req.query;
  
  
  try {
    await connection.execute(
      `UPDATE TOOL_IMG SET `
      +`IMG_SRC = :img `
      +`WHERE PRODUCT_ID = :PRODUCT_ID`
      [ img, PRODUCT_ID ],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/tools/product/type/list', async (req, res) => {
  const { type } = req.query;
  
  try {
    const result = await connection.execute(
      `SELECT * FROM TOOL_PRODUCTS `
      + `WHERE TYPE LIKE '%${type}%' `
      + `ORDER BY UDATETIME DESC `
      
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });

    const count = await connection.execute(
      `SELECT COUNT(*) FROM TBL_BOARD`
    );
    
    
    // 리턴
    res.json({
        result : "success",
        boardList : rows,
        count : count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});
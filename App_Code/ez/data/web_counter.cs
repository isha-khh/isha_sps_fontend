///1.19.0128C@流量統計

using System;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Web;
using Newtonsoft.Json;

/// <summary>
/// web_counter 的摘要描述
/// </summary>
/// 

namespace ez.data
{
    public class web_counter : ez.function
    {
        ez.sql sql = new ez.sql();

        #region 主檔

        public string dbTableName = "web_counter";   //資料表名稱
        public string log;

        #region 資料型別

        public struct DataQuery
        {
            public string nation;
            public DateTime? date_min;
            public DateTime? date_max;

            public string SelectColumns;
            public int Total;
            public int? PageSize;
            public int? NowPage;
            public int PrePage;
            public int NextPage;
            public int MaxPage;
            public string Sort;
        }

        public struct AnalysisInfo
        {
            public int Count;
            public float Total;
        }

        #endregion

        #region 新增

        public bool Add(string nation, int total = 0)
        {
            bool success = true;
            log = "";
            int hr = DateTime.Now.Hour;
            string column = "nation,Total,HR" + hr + ",LastIP";
            string sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", nation));
            OleDbParameters.Add(new OleDbParameter("Total", total + 1));
            OleDbParameters.Add(new OleDbParameter("HR" + hr, 1));
            OleDbParameters.Add(new OleDbParameter("LastIP", getIP()));
            success = sql.execute(sqlQuery, OleDbParameters);
            log = sql.log;

            return success;
        }

        #endregion

        #region 修改

        public bool Edit(int total, int ID)
        {
            bool success = true;
            log = "";
            int hr = DateTime.Now.Hour;
            string sqlQuery = "update [" + dbTableName + "] set Total=Total+1,HR" + hr + "=HR" + hr + "+1,LastIP=? where ID=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("LastIP", getIP()));
            OleDbParameters.Add(new OleDbParameter("ID", ID));
            success = sql.execute(sqlQuery, OleDbParameters);
            log = sql.log;

            return success;
        }

        #endregion

        #region Check

        public string counterCookieName = "web_counter";

        public struct CounterInfo
        {
            public DateTime date { get; set; }
            public string ip { get; set; }
            public string nation { get; set; }
        }

        private CounterInfo CDecode(string json)
        {
            json = encrypt.DecryptAutoKey(json);   //解密
            CounterInfo info = JsonConvert.DeserializeObject<CounterInfo>(json);
            return info;
        }

        private string CEecode(CounterInfo info)
        {
            string json = JsonConvert.SerializeObject(info);
            json = encrypt.EncryptAutoKey(json);   //加密
            return json;
        }

        public bool Check(string nation)
        {
            bool success = true;
            log = "";

            bool hitAdd = true;
            string ip = getIP();
            if (!isStrNull(HttpContext.Current.Request.Cookies[counterCookieName]))
            {
                CounterInfo info = CDecode(HttpContext.Current.Request.Cookies[counterCookieName].Value);
                if (info.ip == ip && info.date.Date == Now().Date && info.nation == nation)
                {
                    hitAdd = false;
                }
            }

            if (hitAdd)
            {
                string sqlQuery = "select Top 1 ID,[Date],Total from " + dbTableName + " where nation=? order by ID desc";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("nation", nation));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    if (ValDate(row["Date"]).Date == Now().Date)
                    {
                        Edit(Val(row["Total"]), Val(dt.Rows[0]["ID"]));
                    }
                    else
                    {
                        Add(nation);
                    }
                }
                else { Add(nation); }

                HttpContext.Current.Response.Cookies[counterCookieName].Value = CEecode(new CounterInfo() { date = Now(), nation = nation, ip = ip });
                HttpContext.Current.Response.Cookies[counterCookieName].Expires = DateTime.Now.AddMonths(1);
            }

            return success;
        }

        #endregion

        public int GetFirstYear()  //取得第一筆訂單的年份
        {
            string sqlQuery = "select top 1 [Date] from [" + dbTableName + "]  order by ID asc";
            DataTable dt = sql.selectTable(sqlQuery);
            if (dt.Rows.Count > 0)
            {
                return ValDate(dt.Rows[0]["Date"]).Year;
            }
            else
            {
                return Now().Year;
            }
        }

        public AnalysisInfo AnalysisCount(DataQuery queryInfo)
        {
            AnalysisInfo AnalysisInfo = new AnalysisInfo();
            AnalysisInfo.Count = 0;
            AnalysisInfo.Total = 0;

            string sqlQuery = "select  count(*) as rowTotal, sum(Total) as sumTotal from [" + dbTableName + "] where 1=1";
            ArrayList listParameters = new ArrayList();

            if (!isStrNull(queryInfo.nation))
            {
                sqlQuery += " and nation=?";
                listParameters.Add(new OleDbParameter("nation", queryInfo.nation));
            }
            if (queryInfo.date_min.HasValue)
            {
                sqlQuery += " and [Date]>=?";
                listParameters.Add(new OleDbParameter("date_min", dateTimeStr(queryInfo.date_min.Value)));
            }
            if (queryInfo.date_max.HasValue)
            {
                sqlQuery += " and [Date]<?";
                listParameters.Add(new OleDbParameter("date_max", dateTimeStr(queryInfo.date_max.Value.AddDays(1))));
            }


            DataTable dt = sql.selectTable(sqlQuery, listParameters);
            if (dt.Rows.Count > 0 && !isStrNull(dt.Rows[0]["rowTotal"])) { AnalysisInfo.Count = Val(dt.Rows[0]["rowTotal"]); }
            if (dt.Rows.Count > 0 && !isStrNull(dt.Rows[0]["sumTotal"])) { AnalysisInfo.Total = ValFloat(dt.Rows[0]["sumTotal"]); }

            return AnalysisInfo;
        }

        #endregion
    }
}

///1.20.0107C@電用何處模組

using System;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Web.UI;
using System.Web.UI.WebControls;

/// <summary>
/// where_to_use 的摘要描述
/// </summary>

namespace ez.data
{
    public class where_to_use : ez.function
    {
        ez.sql sql = new ez.sql();

        #region 主檔

        public string dbTableName = "where_to_use";   //資料表名稱
        public string[] statusValue = { "顯示", "隱藏" };   //商品狀態
        public string[] kindValue = { "全年", "夏月" };   //分類


        public DataInfo Data;
        public DataQuery QuerySource;
        public DataTable QueryView;

        public string log;

        #region 資料型別

        public struct DataInfo
        {
            public string nation;
            public int num;
            public string subject;
            public int? kind;
            public float? use_value;
            public string status;
            public DateTime? reg_time;
        }

        public struct DataQuery
        {
            public string nation;
            public string num_in_array;
            public string num_not_in_array;
            public int? kind;
            public string subject;
            public string status;
            public bool? inTime;
            public bool? selectTop;

            public string SelectColumns;
            public int Total;
            public int? PageSize;
            public int? NowPage;
            public int PrePage;
            public int NextPage;
            public int MaxPage;
            public string Sort;

        }

        #endregion

        #region 查詢

        public bool Query()
        {
            bool success = true;
            log = "";

            QuerySource.Total = 0;

            sql.pageData pageData = new sql.pageData();
            pageData.table = dbTableName;

            pageData.column = "num";
            if (!isStrNull(QuerySource.SelectColumns))
            {
                pageData.column = QuerySource.SelectColumns;
            }

            if (QuerySource.PageSize.HasValue) { pageData.pageSize = QuerySource.PageSize; }
            if (QuerySource.NowPage.HasValue) { pageData.nowPage = QuerySource.NowPage; }

            if (isStrNull(QuerySource.Sort)) { QuerySource.Sort = "num desc"; }
            pageData.sort = QuerySource.Sort;

            ArrayList listParameters = new ArrayList();

            if (!isStrNull(QuerySource.nation))
            {
                pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "nation=?";
                listParameters.Add(new OleDbParameter("nation", QuerySource.nation));
            }
            if (!isStrNull(QuerySource.num_in_array))
            {
                pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "num in (" + QuerySource.num_in_array + ")";
            }
            if (!isStrNull(QuerySource.num_not_in_array))
            {
                pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "num not in (" + QuerySource.num_not_in_array + ")";
            }
            if (QuerySource.kind.HasValue)
            {
                pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "kind=?";
                listParameters.Add(new OleDbParameter("kind", QuerySource.kind.Value));
            }
            if (!isStrNull(QuerySource.subject))
            {
                if (sql.dbIsSql())
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "CHARINDEX(?, subject) > 0";
                }
                else
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(subject),LCase(?),0)<>0";
                }
                listParameters.Add(new OleDbParameter("subject", QuerySource.subject));
            }
            if (!isStrNull(QuerySource.status))
            {
                pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "status=?";
                listParameters.Add(new OleDbParameter("status", QuerySource.status));
            }
            if (QuerySource.inTime.HasValue)  //前台判斷是否上隱藏用
            {
                if (QuerySource.inTime.Value)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "status<>'隱藏'";
                }
            }

            if (listParameters.Count > 0)
            {
                pageData.parameters = listParameters;
            }

            if (QuerySource.selectTop.HasValue && QuerySource.selectTop.Value)
            {
                string sqlQuery = "select top " + pageData.pageSize + " " + pageData.column + " from [" + pageData.table + "]";
                if (!isStrNull(pageData.queryJoinTable)) { sqlQuery += pageData.queryJoinTable; }
                if (!isStrNull(pageData.query)) { sqlQuery += " where " + pageData.query; }
                if (!isStrNull(pageData.queryGroup)) { sqlQuery += " group by " + pageData.queryGroup; }
                if (!isStrNull(pageData.sort)) { sqlQuery += " order by  " + pageData.sort; }
                QueryView = sql.selectTable(sqlQuery, pageData.parameters);
                log = sql.log;
                if (isStrNull(log))
                {
                    pageData.nowPage = 1;
                    pageData.maxPage = 1;
                    pageData.prePage = 1;
                    pageData.nextPage = 1;
                    pageData.total = QueryView.Rows.Count;
                }
                else
                {
                    success = false;
                }
            }
            else if (pageData.load())
            {
                QueryView = pageData.sqlDataPage;
            }
            else
            {
                success = false;
                log = pageData.log;
            }

            QuerySource.NowPage = Val(pageData.nowPage);
            QuerySource.MaxPage = Val(pageData.maxPage);
            QuerySource.PrePage = Val(pageData.prePage);
            QuerySource.NextPage = Val(pageData.nextPage);
            QuerySource.Total = pageData.total;


            return success;
        }

        #endregion

        #region 新增

        public bool Add()
        {
            bool success = true;
            log = "";

            string column = "nation,subject,kind,use_value,status,reg_time";
            string sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", ValString(Data.nation)));
            OleDbParameters.Add(new OleDbParameter("subject", ValString(Data.subject)));
            OleDbParameters.Add(new OleDbParameter("kind", (Data.kind.HasValue ? Data.kind.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("use_value", (Data.use_value.HasValue ? Data.use_value.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("status", ValString(Data.status)));
            OleDbParameters.Add(new OleDbParameter("reg_time", dateTimeStr(Now())));
            success = sql.execute(sqlQuery, OleDbParameters);
            log = sql.log;

            return success;
        }

        #endregion

        #region 讀取

        public bool Load(int num)
        {
            return Load(num, false);
        }

        public bool Load(int num, bool inTime)
        {
            Data = new DataInfo();
            bool success = true;
            log = "";

            string sqlQuery = "select * from [" + dbTableName + "] where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("num", num));
            if (inTime)
            {
                sqlQuery += " and " + dbTableName + ".status<>'隱藏'";
            }
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {

                DataRow row = dt.Rows[0];
                Data.nation = ValString(row["nation"]);
                Data.num = Val(row["num"]);
                Data.subject = ValString(row["subject"]);
                if (!isStrNull(row["kind"])) { Data.kind = Val(row["kind"]); }
                if (!isStrNull(row["use_value"])) { Data.use_value = ValFloat(row["use_value"]); }
                Data.status = ValString(row["status"]);
                if (!isStrNull(row["reg_time"])) { Data.reg_time = ValDate(row["reg_time"]); }
            }
            else
            {
                success = false;
            }
            log = sql.log;

            if (!isStrNull(log))
            {
                success = false;
            }

            return success;
        }

        public int lastNum()
        {
            int num = 0;
            string sqlQuery = "select top 1 num from [" + dbTableName + "] order by num desc";
            DataTable dt = sql.selectTable(sqlQuery);
            if (dt.Rows.Count > 0) { num = Val(dt.Rows[0]["num"]); }
            return num;
        }


        public DataTable RowDataTable(string nation, int kind, bool inTime = false)
        {
            string sqlQuery = "select num,subject,use_value from [" + dbTableName + "] where nation=? and kind=?";
            if (inTime) { sqlQuery += " and status<>'隱藏'"; }
            sqlQuery += " order by use_value desc";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", nation));
            OleDbParameters.Add(new OleDbParameter("kind", kind));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            return dt;
        }

        #endregion

        #region 修改

        public bool Edit()
        {
            bool success = true;
            log = "";

            string column = "nation,subject,kind,use_value,status";

            string sqlQuery = "update [" + dbTableName + "] set " + sql.mark2(column) + " where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", ValString(Data.nation)));
            OleDbParameters.Add(new OleDbParameter("subject", ValString(Data.subject)));
            OleDbParameters.Add(new OleDbParameter("kind", (Data.kind.HasValue ? Data.kind.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("use_value", (Data.use_value.HasValue ? Data.use_value.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("status", ValString(Data.status)));
            OleDbParameters.Add(new OleDbParameter("num", Data.num));
            success = sql.execute(sqlQuery, OleDbParameters);
            log = sql.log;

            return success;
        }

        #endregion

        #region 刪除

        public bool Del(int num)
        {
            bool success = true;
            log = "";
            if (!isStrNull(num))
            {
                int[] nums = { num };
                success = Del(nums);
            }
            else
            {
                success = false;
                log = "尚未指定要刪除的資料";
            }
            return success;
        }

        public bool Del(int[] nums)
        {
            bool success = true;
            log = "";
            if (nums.Length > 0)
            {
                string sqlQuery = "delete from [" + dbTableName + "] where num in (" + string.Join(",", nums) + ")";
                success = sql.execute(sqlQuery);

                log = sql.log;
            }
            else
            {
                success = false;
                log = "尚未指定要刪除的資料";
            }
            return success;
        }

        #endregion

        #region 選項

        public void initStatusOptions(Control obj)
        {
            if (statusValue.Length > 0)
            {
                foreach (string status in statusValue)
                {
                    if (obj is CheckBoxList) { ((CheckBoxList)obj).Items.Add(new ListItem(status)); }
                    else if (obj is DropDownList) { ((DropDownList)obj).Items.Add(new ListItem(status)); }
                    else if (obj is RadioButtonList) { ((RadioButtonList)obj).Items.Add(new ListItem(status)); }
                }
            }
        }

        public void initKindOptions(Control obj)
        {
            if (kindValue.Length > 0)
            {
                int index = 0;
                foreach (string kind in kindValue)
                {
                    ListItem ListItem = new ListItem(kind, index.ToString());
                    if (obj is CheckBoxList) { ((CheckBoxList)obj).Items.Add(ListItem); }
                    else if (obj is DropDownList) { ((DropDownList)obj).Items.Add(ListItem); }
                    else if (obj is RadioButtonList) { ((RadioButtonList)obj).Items.Add(ListItem); }
                    index++;
                }
            }
        }

        #endregion

        #endregion        
    }
}

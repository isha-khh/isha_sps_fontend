///1.20.0107C@處方箋模組

using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.OleDb;
using System.IO;
using System.Linq;
using System.Web.UI;
using System.Web.UI.WebControls;

/// <summary>
/// prescription 的摘要描述
/// </summary>

namespace ez.data
{
    public class prescription : ez.function
    {
        ez.sql sql = new ez.sql();

        #region 主檔

        public int picMax = 0;                                  //圖片數量
        public string Dir = "~/upload/prescription/";   //圖片上傳位置
        public string dbTableName = "prescription";   //資料表名稱
        public string[] statusValue = { "顯示", "隱藏" };   //商品狀態


        public DataInfo Data;
        public DataQuery QuerySource;
        public DataTable QueryView;

        public string log;

        public prescription()  //建構函式
        {
            //取得圖片數量
            ez.data.info WebSet = new ez.data.info();
            WebSet.Load();

            configExtend c = new configExtend("prescription");
            string prescription_pic_max = c.GetSetValue("prescription_pic_max");
            if (!isStrNull(prescription_pic_max))
            {
                picMax = Val(prescription_pic_max);
            }
            else
            {
                picMax = 1;
            }

        }

        #region 資料型別

        public struct DataInfo
        {
            public string nation;
            public int num;
            public string pro_name;
            public string description;
            public string word;
            public string word2;
            public string word3; 
            public int? kwh;
            public string status;
            public int? range;
            public DateTime? reg_time;
            public string[] pic;
        }

        public struct DataQuery
        {
            public string nation;
            public string num_in_array;
            public string num_not_in_array;
            public string pro_name;
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
            if (!isStrNull(QuerySource.pro_name))
            {
                if (sql.dbIsSql())
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "CHARINDEX(?, pro_name) > 0";
                }
                else
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(pro_name),LCase(?),0)<>0";
                }
                listParameters.Add(new OleDbParameter("pro_name", QuerySource.pro_name));
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

            int newRange = (Data.range.HasValue ? Data.range.Value : 1);
            ResetRange(dbTableName, newRange, Data.nation);  //重新整理排序

            string column = "nation,pro_name,description,word,word2,word3,kwh,status,range,reg_time,pic";
            string sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", ValString(Data.nation)));
            OleDbParameters.Add(new OleDbParameter("pro_name", ValString(Data.pro_name)));
            OleDbParameters.Add(new OleDbParameter("description", ValString(Data.description)));
            OleDbParameters.Add(new OleDbParameter("word", ValString(Data.word)));
            OleDbParameters.Add(new OleDbParameter("word2", ValString(Data.word2)));
            OleDbParameters.Add(new OleDbParameter("word3", ValString(Data.word3))); 
            OleDbParameters.Add(new OleDbParameter("kwh", (Data.kwh.HasValue ? Data.kwh.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("status", ValString(Data.status)));
            OleDbParameters.Add(new OleDbParameter("range", newRange));
            OleDbParameters.Add(new OleDbParameter("reg_time", dateTimeStr(Now())));
            OleDbParameters.Add(new OleDbParameter("pic", (Data.pic.Length > 0 ? string.Join(",", Data.pic) : (object)DBNull.Value)));
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
                Data.pro_name = ValString(row["pro_name"]);
                Data.description = ValString(row["description"]);
                Data.word = ValString(row["word"]);
                Data.word2 = ValString(row["word2"]);
                Data.word3 = ValString(row["word3"]); 
                if (!isStrNull(row["kwh"])) { Data.kwh = Val(row["kwh"]); }
                Data.status = ValString(row["status"]);
                if (!isStrNull(row["range"])) { Data.range = Val(row["range"]); }
                if (!isStrNull(row["reg_time"])) { Data.reg_time = ValDate(row["reg_time"]); }
                string[] pic = new string[picMax];
                if (!isStrNull(row["pic"]))
                {
                    string[] dbPic = row["pic"].ToString().Split(',');
                    for (int i = 0; i < dbPic.Length; i++) { if (i < pic.Length) { pic[i] = dbPic[i]; } }
                }
                Data.pic = pic;
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


        public DataTable RowDataTable(string nation, bool inTime = false)
        {
            string sqlQuery = "select num,pro_name,description,word,word2,word3,kwh,reg_time,pic from [" + dbTableName + "] where nation=?";
            if (inTime) { sqlQuery += " and status<>'隱藏'"; }
            sqlQuery += " order by range";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", nation));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            return dt;
        }

        #endregion

        #region 修改

        public bool Edit()
        {
            bool success = true;
            log = "";

            string column = "nation,pro_name,description,word,word2,word3,kwh,status,pic";

            string sqlQuery = "update [" + dbTableName + "] set " + sql.mark2(column) + " where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", ValString(Data.nation)));
            OleDbParameters.Add(new OleDbParameter("pro_name", ValString(Data.pro_name)));
            OleDbParameters.Add(new OleDbParameter("description", ValString(Data.description)));
            OleDbParameters.Add(new OleDbParameter("word", ValString(Data.word)));
            OleDbParameters.Add(new OleDbParameter("word2", ValString(Data.word2)));
            OleDbParameters.Add(new OleDbParameter("word3", ValString(Data.word3))); 
            OleDbParameters.Add(new OleDbParameter("kwh", (Data.kwh.HasValue ? Data.kwh.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("status", ValString(Data.status)));
            OleDbParameters.Add(new OleDbParameter("pic", (Data.pic.Length > 0 ? string.Join(",", Data.pic) : (object)DBNull.Value)));
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
                string sqlQuery = "";
                sqlQuery = "select num,pic from [" + dbTableName + "] where num in (" + string.Join(",", nums) + ")";
                DataTable dt = sql.selectTable(sqlQuery);
                if (dt.Rows.Count > 0)
                {
                    ez.fileSystem fileSystem = new ez.fileSystem();
                    foreach (DataRow row in dt.Rows)
                    {
                        try
                        {
                            if (!isStrNull(row["pic"]))
                            {
                                string[] pics = row["pic"].ToString().Split(',');
                                foreach (string pic in pics)
                                {
                                    if (!picIsUse(pic, Val(row["num"]))) { fileSystem.Delete(Dir + pic); }
                                }
                            }
                        }
                        catch (Exception)
                        {

                        }
                    }

                }

                sqlQuery = "delete from [" + dbTableName + "] where num in (" + string.Join(",", nums) + ")";
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

        public bool picIsUse(string pic, int num)  //檢查是否有別的商品共用圖片
        {
            bool _picIsUse = false;

            string sqlQuery = "select num from [" + dbTableName + "] where num<>?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("num", num));
            if (sql.dbIsSql())
            {
                sqlQuery += " and (',' + pic + ',') like N'%,' + ? + ',%'";
                OleDbParameters.Add(new OleDbParameter("pic", pic));
            }
            else
            {
                sqlQuery += " and InStr(1,LCase(',' + pic + ','),LCase(?),0)<>0";
                OleDbParameters.Add(new OleDbParameter("pic", "," + pic + ","));
            }

            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);

            _picIsUse = (dt.Rows.Count > 0 ? true : false);

            return _picIsUse;
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

        public struct JsonData
        {
            public List<Appliances> appliances;
        }

        public struct Appliances
        {
            public string name;
        }

        public void initAppliancesOptions(Control obj)
        {
            using (StreamReader r = new StreamReader(Server.MapPath("~/demo/data/appliances.json")))
            {
                string json = r.ReadToEnd();
                JsonData items = JsonConvert.DeserializeObject<JsonData>(json);

                if (items.appliances.Count > 0)
                {
                    foreach (Appliances app in items.appliances.OrderBy(o => o.name))
                    {
                        ListItem ListItem = new ListItem(app.name);
                        if (obj is CheckBoxList) { ((CheckBoxList)obj).Items.Add(ListItem); }
                        else if (obj is DropDownList) { ((DropDownList)obj).Items.Add(ListItem); }
                        else if (obj is RadioButtonList) { ((RadioButtonList)obj).Items.Add(ListItem); }
                    }
                }
            }
        }

        #endregion

        #region 排序

        public bool SaveSort(int[] nums)
        {
            bool success = true;
            log = "";

            string sqlQuery = "select top 1 range from [" + dbTableName + "] where num in (" + string.Join(",", nums) + ") order by range";
            DataTable dt = sql.selectTable(sqlQuery);
            if (dt.Rows.Count > 0)
            {
                int range = Val(dt.Rows[0]["range"]);
                foreach (int num in nums)
                {
                    sqlQuery = "update [" + dbTableName + "] set range=? where num=?";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("range", range));
                    OleDbParameters.Add(new OleDbParameter("num", num));
                    success = sql.execute(sqlQuery, OleDbParameters);
                    if (!success)
                    {
                        log = sql.log;
                        break;
                    }
                    range++;
                }
            }

            return success;
        }

        #endregion

        #endregion

        #region 推薦公司

        public class company : ez.function
        {
            ez.sql sql = new ez.sql();

            public int picMax = 0;                                  //圖片數量
            public string Dir = "~/upload/prescription_company/";   //圖片上傳位置
            public int LevelMax = 1;                    //層數，由商品主檔取得
            public string dbTableName = "prescription_company";  //資料表名稱

            public DataInfo Data;
            public string log;

            DataTable kindDt = new DataTable();
            int kindProId = 0;

            #region 資料型別

            public struct DataInfo
            {
                public int num;
                public string nation;
                public string kind;
                public int? root;
                public int? range;
                public int? pro_id;
                public string word;
                public string pro_num;
                public float? rated;
                public float? electricity;
                public string[] pic;
            }

            #endregion

            #region 選項

            public void InitOptions(DropDownList obj, int pro_id)
            {
                InitOptions(obj, pro_id, 0, 1);
            }

            public void InitOptions(DropDownList obj, int pro_id, int root, int level)
            {
                if (LevelMax > 0)
                {
                    DataTable dt = RowDataTable(root, pro_id);
                    if (dt.Rows.Count > 0)
                    {
                        foreach (DataRow row in dt.Rows)
                        {
                            string d = "";
                            for (int i = 1; i < level; i++) { d += "…"; }
                            obj.Items.Add(new ListItem(d + row["kind"].ToString(), row["num"].ToString()));
                            if (level + 1 <= LevelMax)
                            {
                                InitOptions(obj, pro_id, Val(row["num"]), level + 1);
                            }
                        }
                    }
                }
            }

            #endregion

            #region 讀取

            public string kindText(int? Value)
            {
                string Text = "";
                if (Value.HasValue)
                {
                    string sqlQuery = "select kind from [" + dbTableName + "] where num=?";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("num", Value));
                    DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                    if (dt.Rows.Count > 0) { Text = dt.Rows[0]["kind"].ToString(); }
                }
                return Text;
            }

            public bool Load(int num)
            {
                Data = new DataInfo();
                bool success = true;
                log = "";

                string sqlQuery = "select a.*,b.kind as rootKind from [" + dbTableName + "] as a left join  [" + dbTableName + "] as b on a.root=b.num where a.num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", num));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    Data.num = Val(row["num"]);
                    Data.nation = ValString(row["nation"]);
                    Data.kind = ValString(row["kind"]);
                    Data.root = Val(row["root"]);
                    Data.range = Val(row["range"]);
                    Data.word = ValString(row["word"]);
                    Data.pro_num = ValString(row["pro_num"]);
                    if (!isStrNull(row["rated"])) { Data.rated = ValFloat(row["rated"]); }
                    if (!isStrNull(row["electricity"])) { Data.electricity = ValFloat(row["electricity"]); }
                    string[] pic = new string[picMax];
                    if (!isStrNull(row["pic"]))
                    {
                        string[] dbPic = row["pic"].ToString().Split(',');
                        for (int i = 0; i < dbPic.Length; i++) { if (i < pic.Length) { pic[i] = dbPic[i]; } }
                    }
                    Data.pic = pic;
                }
                log = sql.log;

                if (!isStrNull(log))
                {
                    success = false;
                }

                return success;
            }

            public DataTable RowDataTable(int pro_id)
            {
                string sqlQuery = "select * from [" + dbTableName + "] where pro_id=? order by range";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("pro_id", pro_id));
                return sql.selectTable(sqlQuery, OleDbParameters);
            }

            public DataTable RowDataTable(int root, int pro_id, int num = 0)
            {
                if (kindProId != pro_id)
                {
                    kindProId = pro_id;
                    string sqlQuery = "select * from [" + dbTableName + "] where pro_id=? order by range";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("pro_id", pro_id));
                    kindDt = sql.selectTable(sqlQuery, OleDbParameters);
                }
                DataTable dt = new DataTable();
                if (kindDt.Rows.Count > 0)
                {
                    foreach (DataColumn item in kindDt.Columns)
                        dt.Columns.Add(item.ColumnName, item.DataType);

                    string numSql = "";
                    if (num > 0) { numSql = " and num=" + num.ToString(); }
                    DataRow[] trs = kindDt.Select("root=" + root.ToString() + numSql);
                    foreach (DataRow row in trs)
                    {
                        DataRow tr = dt.NewRow();
                        foreach (DataColumn item in kindDt.Columns)
                        {
                            tr[item.ColumnName] = row[item.ColumnName];
                        }
                        dt.Rows.Add(tr);
                    }
                }
                return dt;
            }

            public ArrayList RowData(int root, int pro_id)
            {
                ArrayList rows = new ArrayList();
                DataTable dt = RowDataTable(root, pro_id);
                if (dt.Rows.Count > 0)
                {
                    foreach (DataRow row in dt.Rows)
                    {
                        Data = new DataInfo();
                        Data.num = Val(row["num"]);
                        Data.kind = ValString(row["kind"]);
                        Data.word = ValString(row["word"]);
                        Data.pro_num = ValString(row["pro_num"]);
                        if (!isStrNull(row["rated"])) { Data.rated = ValFloat(row["rated"]); }
                        if (!isStrNull(row["electricity"])) { Data.electricity = ValFloat(row["electricity"]); }
                        string[] pic = new string[picMax];
                        if (!isStrNull(row["pic"]))
                        {
                            string[] dbPic = row["pic"].ToString().Split(',');
                            for (int i = 0; i < dbPic.Length; i++) { if (i < pic.Length) { pic[i] = dbPic[i]; } }
                        }
                        Data.pic = pic;
                        Data.range = Val(row["range"]);
                        rows.Add(Data);
                    }
                }

                return rows;
            }

            public int lastNum()
            {
                int num = 0;
                string sqlQuery = "select top 1 num from [" + dbTableName + "] order by num desc";
                DataTable dt = sql.selectTable(sqlQuery);
                if (dt.Rows.Count > 0) { num = Val(dt.Rows[0]["num"]); }
                return num;
            }

            #endregion

            #region 新增

            public bool Add()
            {
                bool success = true;
                log = "";

                //檢查料號是否重複

                if (!Data.root.HasValue) { Data.root = 0; }
                if (!Data.range.HasValue) { Data.range = NewRange(Data.root.Value, Data.pro_id.Value); }
                string column = "nation,kind,root,range,word,pro_num,rated,electricity,pic,pro_id";
                string sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("nation", Data.nation));
                OleDbParameters.Add(new OleDbParameter("kind", Data.kind));
                OleDbParameters.Add(new OleDbParameter("root", Data.root));
                OleDbParameters.Add(new OleDbParameter("range", Data.range));
                OleDbParameters.Add(new OleDbParameter("word", Data.word));
                OleDbParameters.Add(new OleDbParameter("pro_num", Data.pro_num));
                OleDbParameters.Add(new OleDbParameter("rated", (Data.rated.HasValue ? Data.rated.Value : (object)DBNull.Value)));
                OleDbParameters.Add(new OleDbParameter("electricity", (Data.electricity.HasValue ? Data.electricity.Value : (object)DBNull.Value)));
                OleDbParameters.Add(new OleDbParameter("pic", (Data.pic.Length > 0 ? string.Join(",", Data.pic) : (object)DBNull.Value)));
                OleDbParameters.Add(new OleDbParameter("pro_id", Data.pro_id));
                success = sql.execute(sqlQuery, OleDbParameters);
                log = sql.log;



                return success;
            }

            public int NewRange(int root, int pro_id)
            {
                int range = 1;
                string sqlQuery = "select top 1 range from [" + dbTableName + "] where root=? and pro_id=? order by range desc";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("root", root));
                OleDbParameters.Add(new OleDbParameter("pro_id", pro_id));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0) { range = Val(dt.Rows[0]["range"]) + 1; }
                return range;
            }

            #endregion

            #region 排序

            public bool SaveSort(int[] nums)
            {
                bool success = true;
                log = "";

                string sqlQuery = "select top 1 range from [" + dbTableName + "] where num in (" + string.Join(",", nums) + ") order by range";
                DataTable dt = sql.selectTable(sqlQuery);
                if (dt.Rows.Count > 0)
                {
                    int range = Val(dt.Rows[0]["range"]);
                    foreach (int num in nums)
                    {
                        sqlQuery = "update [" + dbTableName + "] set range=? where num=?";
                        ArrayList OleDbParameters = new ArrayList();
                        OleDbParameters.Add(new OleDbParameter("range", range));
                        OleDbParameters.Add(new OleDbParameter("num", num));
                        success = sql.execute(sqlQuery, OleDbParameters);
                        if (!success)
                        {
                            log = sql.log;
                            break;
                        }
                        range++;
                    }
                }

                return success;
            }

            #endregion

            #region 修改

            public bool Edit()
            {
                bool success = true;
                log = "";

                string column = "kind,word,pro_num,rated,electricity,pic,range";
                string sqlQuery = "update [" + dbTableName + "] set " + sql.mark2(column) + " where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("kind", Data.kind));
                OleDbParameters.Add(new OleDbParameter("word", Data.word));
                OleDbParameters.Add(new OleDbParameter("pro_num", Data.pro_num));
                OleDbParameters.Add(new OleDbParameter("rated", (Data.rated.HasValue ? Data.rated.Value : (object)DBNull.Value)));
                OleDbParameters.Add(new OleDbParameter("electricity", (Data.electricity.HasValue ? Data.electricity.Value : (object)DBNull.Value)));
                OleDbParameters.Add(new OleDbParameter("pic", (Data.pic.Length > 0 ? string.Join(",", Data.pic) : (object)DBNull.Value)));
                OleDbParameters.Add(new OleDbParameter("range", Data.range));
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

                    string sqlQuery = "select num from [" + dbTableName + "] where root in (" + string.Join(",", nums) + ")";
                    DataTable dt = sql.selectTable(sqlQuery);
                    if (dt.Rows.Count > 0)
                    {
                        //刪除下一層分類
                        List<int> num = new List<int>();
                        foreach (DataRow row in dt.Rows) { num.Add(Val(row["num"])); }
                        Del(num.ToArray());
                    }
                    if (picMax > 0)
                    {
                        string column = "";
                        for (int i = 1; i <= picMax; i++) { column += (column != "" ? "," : "") + "pic" + i.ToString(); }
                        sqlQuery = "select " + column + " from [" + dbTableName + "] where num in (" + string.Join(",", nums) + ")";
                        DataTable dt2 = sql.selectTable(sqlQuery);
                        if (dt.Rows.Count > 0)
                        {
                            ez.fileSystem fileSystem = new ez.fileSystem();
                            foreach (DataRow row in dt2.Rows)
                            {
                                try
                                {
                                    for (int i = 1; i <= picMax; i++) { if (!isStrNull(row["pic" + i.ToString()])) { fileSystem.Delete(Dir + row["pic" + i.ToString()].ToString()); } } //刪除圖片
                                }
                                catch (Exception)
                                {

                                }
                            }

                        }
                    }

                    //刪除分類
                    sqlQuery = "delete from [" + dbTableName + "] where num in (" + string.Join(",", nums) + ")";
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

            public bool Clear(int pro_id)
            {
                bool success = true;
                log = "";
                string sqlQuery = "delete from [" + dbTableName + "] where pro_id=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("pro_id", pro_id));
                success = sql.execute(sqlQuery, OleDbParameters);
                log = sql.log;
                return success;
            }

            #endregion



        }

        #endregion
    }
}

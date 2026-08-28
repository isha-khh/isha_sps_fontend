///1.20.0107@據點模組

using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.OleDb;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

/// <summary>
/// store 的摘要描述
/// </summary>

namespace ez.data
{
    public class store : ez.function
    {
        ez.sql sql = new ez.sql();

        #region 主檔

        public int picMax = 0;                                  //圖片數量
        public string Dir = "~/upload/store/";   //圖片上傳位置
        public string dbTableName = "store";   //資料表名稱
        public string[] statusValue = { "顯示", "隱藏" };   //商品狀態


        public DataInfo Data;
        public DataQuery QuerySource;
        public DataTable QueryView;

        public string log;

        public store()  //建構函式
        {
            //取得圖片數量
            ez.data.info WebSet = new ez.data.info();
            WebSet.Load();

            configExtend c = new configExtend("store");
            string store_pic_max = c.GetSetValue("store_pic_max");
            if (!isStrNull(store_pic_max))
            {
                picMax = Val(store_pic_max);
            }
            else
            {
                picMax = 0;
            }

        }

        #region 資料型別

        public struct DataInfo
        {
            public string nation;
            public int num;
            public string pro_num;
            public string pro_name;
            public int? kind;
            public string level;
            public string areas;
            public int? city;
            public int? area;
            public string address;
            public string postnumber;
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
            public string pro_num;
            public string pro_name;
            public string keyword;
            public string status;
            public int? kind;
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
            if (!isStrNull(QuerySource.pro_num))
            {
                if (sql.dbIsSql())
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "(CHARINDEX(?, pro_num) > 0)";
                }
                else
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "(InStr(1,LCase(pro_num),LCase(?),0)<>0)";
                }
                listParameters.Add(new OleDbParameter("pro_num", QuerySource.pro_num));
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
            if (QuerySource.kind.HasValue && QuerySource.kind.Value > 0)
            {
                kind kind = new kind();
                pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "kind in (" + QuerySource.kind.Value.ToString() + kind.subKinds(QuerySource.kind.Value) + ")";
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

            string column = "nation,pro_num,pro_name,kind,level,areas,postnumber,city,area,address,status,range,reg_time,pic";
            string sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", ValString(Data.nation)));
            OleDbParameters.Add(new OleDbParameter("pro_num", ValString(Data.pro_num)));
            OleDbParameters.Add(new OleDbParameter("pro_name", ValString(Data.pro_name)));
            OleDbParameters.Add(new OleDbParameter("kind", (Data.kind.HasValue ? Data.kind.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("level", ValString(Data.level)));
            OleDbParameters.Add(new OleDbParameter("areas", ValString(Data.areas)));
            OleDbParameters.Add(new OleDbParameter("postnumber", ValString(Data.postnumber)));
            OleDbParameters.Add(new OleDbParameter("city", (Data.city.HasValue ? Data.city.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("area", (Data.area.HasValue ? Data.area.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("address", ValString(Data.address)));
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
                Data.pro_num = ValString(row["pro_num"]);
                Data.pro_name = ValString(row["pro_name"]);
                if (!isStrNull(row["kind"])) { Data.kind = Val(row["kind"]); }
                Data.level = ValString(row["level"]);
                Data.areas = ValString(row["areas"]);
                Data.postnumber = ValString(row["postnumber"]);
                if (!isStrNull(row["city"])) { Data.city = Val(row["city"]); }
                if (!isStrNull(row["area"])) { Data.area = Val(row["area"]); }
                Data.address = ValString(row["address"]);
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


        public DataTable RowDataTable(int kind, string nation, bool inTime = false)
        {
            store.kind store_kind = new store.kind();
            string sqlQuery = "select num,pro_name,level,areas,postnumber,city,area,address from [" + dbTableName + "] where nation=?";
            if (kind > 0) { sqlQuery += " and kind in (" + kind.ToString() + store_kind.subKinds(kind) + ")"; }
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

            string column = "nation,pro_num,pro_name,kind,level,areas,postnumber,city,area,address,status,pic";

            string sqlQuery = "update [" + dbTableName + "] set " + sql.mark2(column) + " where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", ValString(Data.nation)));
            OleDbParameters.Add(new OleDbParameter("pro_num", ValString(Data.pro_num)));
            OleDbParameters.Add(new OleDbParameter("pro_name", ValString(Data.pro_name)));
            OleDbParameters.Add(new OleDbParameter("kind", (Data.kind.HasValue ? Data.kind.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("level", ValString(Data.level)));
            OleDbParameters.Add(new OleDbParameter("areas", ValString(Data.areas)));
            OleDbParameters.Add(new OleDbParameter("postnumber", ValString(Data.postnumber)));
            OleDbParameters.Add(new OleDbParameter("city", (Data.city.HasValue ? Data.city.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("area", (Data.area.HasValue ? Data.area.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("address", ValString(Data.address)));
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

        #region 分類

        public class kind : ez.function
        {
            ez.sql sql = new ez.sql();

            public int picMax = 0;  //圖片數量
            public string Dir = "~/upload/store_kind/";   //圖片上傳位置

            public int LevelMax = 1;                    //分類層數
            public string dbTableName = "store_kind";  //資料表名稱

            public DataInfo Data;
            public string log;

            DataTable kindDt = new DataTable();
            string kindNation = "";

            #region 資料型別

            public struct DataInfo
            {
                public string nation;
                public int num;
                public string kind;
                public int? root;
                public int? range;
                public string[] pic;
            }

            #endregion

            #region 選項

            public void initRootOptions(Control obj, string nation)
            {
                if (!isStrNull(nation))
                {
                    DataTable dt = RowDataTable(0, nation);
                    if (dt.Rows.Count > 0)
                    {
                        foreach (DataRow row in dt.Rows)
                        {
                            ListItem oItem = new ListItem(row["kind"].ToString(), row["num"].ToString());
                            if (obj is DropDownList)
                            {
                                ((DropDownList)obj).Items.Add(oItem);
                            }
                            else if (obj is CheckBoxList)
                            {
                                ((CheckBoxList)obj).Items.Add(oItem);
                            }
                            else if (obj is RadioButtonList)
                            {
                                ((RadioButtonList)obj).Items.Add(oItem);
                            }
                        }
                    }
                }
            }

            public void InitOptions(Control obj, string nation)
            {
                InitOptions(obj, nation, 0, 1);
            }

            public void InitOptions(Control obj, string nation, int root, int level)
            {
                if (!isStrNull(nation))
                {
                    DataTable dt = RowDataTable(root, nation);
                    if (dt.Rows.Count > 0)
                    {
                        foreach (DataRow row in dt.Rows)
                        {
                            string d = "";
                            for (int i = 1; i < level; i++) { d += "…"; }
                            ListItem oItem = new ListItem(d + row["kind"].ToString(), row["num"].ToString());
                            if (obj is DropDownList)
                            {
                                ((DropDownList)obj).Items.Add(oItem);
                            }
                            else if (obj is CheckBoxList)
                            {
                                ((CheckBoxList)obj).Items.Add(oItem);
                            }
                            else if (obj is RadioButtonList)
                            {
                                ((RadioButtonList)obj).Items.Add(oItem);
                            }

                            if (level + 1 <= LevelMax)
                            {
                                InitOptions(obj, nation, Val(row["num"]), level + 1);
                            }
                        }
                    }
                }
            }

            public string subKinds(int root)
            {
                string kinds = "";
                string sqlQuery = "select num from [" + dbTableName + "] where root=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("root", root));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    foreach (DataRow row in dt.Rows)
                    {
                        kinds += "," + row["num"].ToString();
                        kinds += subKinds(Val(row["num"]));
                    }
                }
                return kinds;
            }

            #endregion

            #region Tree

            public class KindInfo
            {
                public int num;
                public string kind;
                public KindInfo(int num, string kind)
                {
                    this.num = num;
                    this.kind = kind;
                }
            }

            public ArrayList KindTree(int num)
            {
                ArrayList Tree = new ArrayList();
                Tree = KindTree(num, Tree);
                return Tree;
            }

            //取得目前所在分類的完整分類路徑
            public ArrayList KindTree(int num, ArrayList Tree)
            {
                string sqlQuery = "select root,num,kind from [" + dbTableName + "] where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", num));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    if (Val(dt.Rows[0]["root"]) > 0)
                    {
                        Tree = KindTree(Val(dt.Rows[0]["root"]), Tree);
                    }
                    Tree.Add(new KindInfo(num, ValString(dt.Rows[0]["kind"])));
                }
                return Tree;
            }

            #endregion

            #region 新增

            public bool Add()
            {
                bool success = true;
                log = "";

                if (!Data.root.HasValue) { Data.root = 0; }
                if (!Data.range.HasValue) { Data.range = NewRange(Data.root.Value, Data.nation); }
                string column = "nation,kind,root,range";
                for (int i = 1; i <= picMax; i++) { column += ",pic" + i.ToString(); }
                string sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("nation", Data.nation));
                OleDbParameters.Add(new OleDbParameter("kind", Data.kind));
                OleDbParameters.Add(new OleDbParameter("root", Data.root));
                OleDbParameters.Add(new OleDbParameter("range", Data.range));
                for (int i = 1; i <= picMax; i++)
                {
                    OleDbParameters.Add(new OleDbParameter("pic" + i.ToString(), (!isStrNull(Data.pic[i - 1]) ? Data.pic[i - 1] : "")));
                }
                success = sql.execute(sqlQuery, OleDbParameters);
                log = sql.log;

                return success;
            }

            public int NewRange(int root, string nation)
            {
                int range = 1;
                string sqlQuery = "select top 1 range from [" + dbTableName + "] where root=? and nation=? order by range desc";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("root", root));
                OleDbParameters.Add(new OleDbParameter("nation", nation));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0) { range = Val(dt.Rows[0]["range"]) + 1; }
                return range;
            }

            #endregion

            #region 讀取

            public string kindText(int? Value, bool showRoot = true)
            {
                string Text = "";
                if (Value.HasValue)
                {
                    string sqlQuery = "select kind,root from [" + dbTableName + "] where num=?";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("num", Value));
                    DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);

                    if (dt.Rows.Count > 0)
                    {
                        if (Val(dt.Rows[0]["root"]) > 0 && showRoot)
                        {
                            Text = kindText(Val(dt.Rows[0]["root"])) + "/" + dt.Rows[0]["kind"].ToString();
                        }
                        else
                        {
                            Text = dt.Rows[0]["kind"].ToString();
                        }
                    }
                }
                return Text;
            }

            public bool Load(int num)
            {
                Data = new DataInfo();
                bool success = true;
                log = "";

                string sqlQuery = "select * from [" + dbTableName + "] where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", num));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    Data.nation = ValString(row["nation"]);
                    Data.num = Val(row["num"]);
                    Data.kind = ValString(row["kind"]);
                    Data.root = Val(row["root"]);
                    Data.range = Val(row["range"]);
                    if (picMax > 0)
                    {
                        Data.pic = new string[picMax];
                        for (int i = 1; i <= picMax; i++) { Data.pic[i - 1] = ValString(row["pic" + i.ToString()]); }
                    }
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


            public DataTable RowDataTable(int root, string nation)
            {
                if (kindNation != nation)
                {
                    kindNation = nation;
                    string sqlQuery = "select num,kind,root from [" + dbTableName + "] where nation=? order by root,range";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("nation", nation));
                    kindDt = sql.selectTable(sqlQuery, OleDbParameters);
                }
                DataTable dt = new DataTable();
                if (kindDt.Rows.Count > 0)
                {
                    foreach (DataColumn item in kindDt.Columns)
                        dt.Columns.Add(item.ColumnName, item.DataType);

                    DataRow[] trs = kindDt.Select("root=" + root.ToString());
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


            public DataTable RowDataTable()
            {
                string sqlQuery = "select num,kind from [" + dbTableName + "]";
                ArrayList OleDbParameters = new ArrayList();
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                return dt;
            }
            public ArrayList RowData(int root, string nation)
            {
                ArrayList rows = new ArrayList();
                DataTable dt = RowDataTable(root, nation);
                if (dt.Rows.Count > 0)
                {
                    foreach (DataRow row in dt.Rows)
                    {
                        Data = new DataInfo();
                        Data.num = Val(row["num"]);
                        Data.kind = ValString(row["kind"]);
                        rows.Add(Data);
                    }
                }

                return rows;
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

                string column = "kind";
                for (int i = 1; i <= picMax; i++) { column += ",pic" + i.ToString(); }

                string sqlQuery = "update [" + dbTableName + "] set " + sql.mark2(column) + " where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("kind", Data.kind));
                for (int i = 1; i <= picMax; i++)
                {
                    OleDbParameters.Add(new OleDbParameter("pic" + i.ToString(), (!isStrNull(Data.pic[i - 1]) ? Data.pic[i - 1] : "")));
                }
                OleDbParameters.Add(new OleDbParameter("num", Data.num));

                success = sql.execute(sqlQuery, OleDbParameters);
                log = sql.log;

                return success;
            }

            #endregion

            #region 刪除

            public bool Del(int num, bool delRelated)
            {
                bool success = true;
                log = "";
                if (!isStrNull(num))
                {
                    int[] nums = { num };
                    success = Del(nums, delRelated);
                }
                else
                {
                    success = false;
                    log = "尚未指定要刪除的資料";
                }
                return success;
            }

            public bool Del(int[] nums, bool delRelated)
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
                        Del(num.ToArray(), delRelated);
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

                    //刪除相關資料
                    if (delRelated)
                    {
                        store store = new store();
                        sqlQuery = "select num,pic from " + store.dbTableName + " where kind in (" + string.Join(",", nums) + ")";
                        dt = sql.selectTable(sqlQuery);
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
                                            if (!store.picIsUse(pic, Val(row["num"]))) { fileSystem.Delete(store.Dir + pic); }
                                        }
                                    }
                                }
                                catch (Exception)
                                {

                                }
                            }
                        }

                        sqlQuery = "delete from [" + store.dbTableName + "] where kind in (" + string.Join(",", nums) + ")";
                        sql.execute(sqlQuery);
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

            #endregion

        }

        #endregion
    }
}

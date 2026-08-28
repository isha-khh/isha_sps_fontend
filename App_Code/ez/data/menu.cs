///1.15.0226@選單模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;
using System.Web.UI;
using System.Web.UI.WebControls;


public interface MenuGet
{
    void MenuDataGet(ez.data.menu.DataInfo MenuData);
}

namespace ez.data
{
    public class menu : ez.function
    {
       
        ez.sql sql = new ez.sql();

        public int LevelMax = 3;                    //分類層數
        public string dbTableName = "menu_kind";  //資料表名稱

        public DataInfo Data;
        public string log;

        #region 資料型別

        public struct DataInfo
        {
            public string nation;
            public int num;
            public string kind;
            public string kind2;
            public string url;
            public string category;
            public int? root;
            public int? range;
            public int? page_num;
            public string sub_menu_type;
            public string sub_menu_control;
            public string sub_menu_parameter;
            public string sub_menu_html;
        }

        #endregion

        #region 位置

        public List<ListItem> categorys()
        {
            List<ListItem> c = new List<ListItem>();
            c.Add(new ListItem("主選單", "nav"));
            c.Add(new ListItem("選單2", "nav2"));//header區域次選單
            c.Add(new ListItem("選單3", "nav3"));//header區域會員選單
            c.Add(new ListItem("下方連結", "footer"));
            return c;
        }

        public void InitCategorys(Control obj)
        {
            List<ListItem> cs = categorys();
            foreach (ListItem c in cs)
            {
                if (obj is DropDownList) { ((DropDownList)obj).Items.Add(c); }
                else if (obj is RadioButtonList) { ((RadioButtonList)obj).Items.Add(c); }
                else if (obj is CheckBoxList) { ((CheckBoxList)obj).Items.Add(c); }
            }
        }

        #endregion

        #region 下拉選項

        public void InitOptions(DropDownList obj, string nation)
        {
            InitOptions(obj, nation, 0, 1);
        }

        public void InitOptions(DropDownList obj, string nation, int root, int level)
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
                        obj.Items.Add(new ListItem(d + row["kind"].ToString(), row["num"].ToString()));
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
            string column = "nation,kind,kind2,page_num,url,category,root,range"
                +",sub_menu_type,sub_menu_control,sub_menu_parameter,sub_menu_html";
            string sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", Data.nation));
            OleDbParameters.Add(new OleDbParameter("kind", Data.kind));
            OleDbParameters.Add(new OleDbParameter("kind2", Data.kind2));
            OleDbParameters.Add(new OleDbParameter("page_num", (Data.page_num.HasValue?Data.page_num.Value:(object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("url", Data.url));
            OleDbParameters.Add(new OleDbParameter("category", Data.category));
            OleDbParameters.Add(new OleDbParameter("root", Data.root));
            OleDbParameters.Add(new OleDbParameter("range", Data.range));
            OleDbParameters.Add(new OleDbParameter("sub_menu_type", Data.sub_menu_type));
            OleDbParameters.Add(new OleDbParameter("sub_menu_control", Data.sub_menu_control));
            OleDbParameters.Add(new OleDbParameter("sub_menu_parameter", Data.sub_menu_parameter));
            OleDbParameters.Add(new OleDbParameter("sub_menu_html", Data.sub_menu_html));
            success = sql.execute(sqlQuery, OleDbParameters);
            log = sql.log;
            return success;
        }

        public int NewRange(int root, string nation)
        {
            int range = 1;
            string sqlQuery = "select top 1 range from [" + dbTableName + "] where root=? and nation=?  order by range desc";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("root", root));
            OleDbParameters.Add(new OleDbParameter("nation", nation));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0) { range = Val(dt.Rows[0]["range"]) + 1; }
            return range;
        }

        #endregion

        #region 讀取

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
                Data.kind2 = ValString(row["kind2"]);
                if (!isStrNull(row["page_num"])) { Data.page_num = Val(row["page_num"]); }
                Data.url = ValString(row["url"]);
                Data.category = ValString(row["category"]);
                Data.root = Val(row["root"]);
                Data.range = Val(row["range"]);
                Data.sub_menu_type = ValString(row["sub_menu_type"]);
                Data.sub_menu_control = ValString(row["sub_menu_control"]);
                Data.sub_menu_parameter = ValString(row["sub_menu_parameter"]);
                Data.sub_menu_html = ValString(row["sub_menu_html"]);
            }
            log = sql.log;

            if (!isStrNull(log))
            {
                success = false;
            }

            return success;
        }

        public bool LoadPage(int page_num)
        {
            Data = new DataInfo();
            bool success = true;
            log = "";

            string sqlQuery = "select * from [" + dbTableName + "] where page_num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("page_num", page_num));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                Data.nation = ValString(row["nation"]);
                Data.num = Val(row["num"]);
                Data.kind = ValString(row["kind"]);
                Data.kind2 = ValString(row["kind2"]);
                if (!isStrNull(row["page_num"])) { Data.page_num = Val(row["page_num"]); }
                Data.url = ValString(row["url"]);
                Data.category = ValString(row["category"]);
                Data.root = Val(row["root"]);
                Data.range = Val(row["range"]);
                Data.sub_menu_type = ValString(row["sub_menu_type"]);
                Data.sub_menu_control = ValString(row["sub_menu_control"]);
                Data.sub_menu_parameter = ValString(row["sub_menu_parameter"]);
                Data.sub_menu_html = ValString(row["sub_menu_html"]);
            }else
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

        public DataTable RowDataTable(int root, string nation, string column="num,kind", string category="")
        {
            string sqlQuery = "select " + column + " from [" + dbTableName + "] where root=? and nation=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("root", root));
            OleDbParameters.Add(new OleDbParameter("nation", nation));
            if (!isStrNull(category))
            {
                if (sql.dbIsSql())
                {
                    sqlQuery += " and category like N'%' + ? + '%'";               
                }
                else
                {
                    sqlQuery += " and InStr(1,LCase(category),LCase(?),0)<>0";
                }
                OleDbParameters.Add(new OleDbParameter("category", category));
            }
            sqlQuery += " order by range";           
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

            string sqlQuery = "update [" + dbTableName + "] set kind=?, kind2=?, page_num=?, url=?, category=?"
                + ", sub_menu_type=? , sub_menu_control=? , sub_menu_parameter=? , sub_menu_html=? "
                + " where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("kind", Data.kind));
            OleDbParameters.Add(new OleDbParameter("kind2", Data.kind2));
            OleDbParameters.Add(new OleDbParameter("page_num", (Data.page_num.HasValue ? Data.page_num.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("url", Data.url));
            OleDbParameters.Add(new OleDbParameter("category", Data.category));
            OleDbParameters.Add(new OleDbParameter("sub_menu_type", Data.sub_menu_type));
            OleDbParameters.Add(new OleDbParameter("sub_menu_control", Data.sub_menu_control));
            OleDbParameters.Add(new OleDbParameter("sub_menu_parameter", Data.sub_menu_parameter));
            OleDbParameters.Add(new OleDbParameter("sub_menu_html", Data.sub_menu_html));
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
                //刪除
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
   
    }
}

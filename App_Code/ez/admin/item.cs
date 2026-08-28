///1.19.0128@後台選單模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;


/// <summary>
/// item
/// </summary>

namespace ez.admin
{
    public class item : ez.function
    {

        ez.sql sql = new ez.sql();

        public int maxLevel = 2;//階層
        public int num;
        public string title;
        public string url;
        public string icon;
        public int root;
        public int range;
        public string other_url;
        public string s_id;
        public string part_no;
        public int? chapter;
        public string log = "";

        DataTable treeDt = new DataTable();
     

        public DataTable options(int root, string power)
        {

            if (treeDt.Rows.Count == 0)
            {
                string sqlQuery = "select num,title,url,root,target,icon,s_id,part_no,chapter from item where 1=1";
                if (!isStrNull(power))
                {
                    if (power.Length > 0)
                    {
                        if (power.Substring(power.Length - 1, 1) == ",")
                        {
                            power = power.Substring(0, power.Length - 1);
                        }
                    }
                    sqlQuery += " and num in (" + power + ")";
                }
                sqlQuery += " order by root,range";
                treeDt = sql.selectTable(sqlQuery);
            }
            DataTable dt = new DataTable();
           if (treeDt.Rows.Count > 0)
            {
                foreach (DataColumn item in treeDt.Columns)
                    dt.Columns.Add(item.ColumnName, item.DataType);

                DataRow[] trs = treeDt.Select("root=" + root.ToString());
                foreach (DataRow row in trs)
                {
                    DataRow tr = dt.NewRow();
                    foreach (DataColumn item in treeDt.Columns)
                    {
                        tr[item.ColumnName] = row[item.ColumnName];
                    }
                    dt.Rows.Add(tr);
                }
            }
            return dt;
        }

        public int optionsRoot(int num)
        {
            int root = 0;
            if (num > 0)
            {
                string sqlQuery = "select root from item where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", num));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    root = Val(dt.Rows[0]["root"]);
                    if (root == 0) { root = num; }
                }
            }           
            return root;
        }

        public string pageRoot(string urlBase)
        {
            string num = "";
            string sqlQuery = "select root from item where url like '%' + ? + '%' or other_url like '%' + ? + '%'";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("url", urlBase));
            OleDbParameters.Add(new OleDbParameter("other_url", urlBase));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                num = ValString(dt.Rows[0]["root"]);
            }
            return num;
        }

        public string numGet(string title)
        {
            string num = "";
            string sqlQuery = "select num from [item] where [title]=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("title", title));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                num = ValString(dt.Rows[0]["num"]);
            }
            return num;
        }

        public string numGetBySID(string s_id)
        {
            string num = "";
            string sqlQuery = "select num from [item] where [s_id]=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("s_id", s_id));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                num = ValString(dt.Rows[0]["num"]);
            }
            return num;
        }

        public bool load()
        {
            bool success = true;
            log = "";

            string sqlQuery = "select * from [item] where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("num", num));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                title = ValString(row["title"]);
                url = ValString(row["url"]);
                root = Val(row["root"]);
                other_url = ValString(row["other_url"]);
                range = Val(row["range"]);
                icon = ValString(row["icon"]);
                s_id = ValString(row["s_id"]);
                part_no = ValString(row["part_no"]);
                chapter = Val(row["chapter"]);
            }
            log = sql.log;

            if (!isStrNull(log))
            {
                success = false;
            }

            return success;
        }

        public int GetLastNum(int root)
        {
            int LastNum = 0;

            string sqlQuery = "select top 1 num from [item] where root=? order by num desc";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("root", root));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                LastNum = Val(row["num"]);
            }

            return LastNum;
        }

        public bool add()
        {
            bool success = true;
            log = "";
            string column = "[title],url,root,other_url,[target],range,icon,s_id,part_no,chapter";
            string sqlQuery = "insert into [item] (" + column + ") values (" + sql.mark(column) + ")";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("title", title));
            OleDbParameters.Add(new OleDbParameter("url", url));
            OleDbParameters.Add(new OleDbParameter("root", root));
            OleDbParameters.Add(new OleDbParameter("other_url", other_url));
            OleDbParameters.Add(new OleDbParameter("target", "A"));
            OleDbParameters.Add(new OleDbParameter("range", getNewRange()));
            OleDbParameters.Add(new OleDbParameter("icon", icon));
            OleDbParameters.Add(new OleDbParameter("s_id", s_id));
            OleDbParameters.Add(new OleDbParameter("part_no", part_no));
            OleDbParameters.Add(new OleDbParameter("chapter", (chapter.HasValue ? chapter.Value : (object)DBNull.Value)));
            success = sql.execute(sqlQuery, OleDbParameters);
            log = sql.log;

            return success;
        }

        public int getNewRange()
        {
            int newRange = 1;
            DataTable dt = sql.selectTable("select top 1 range from [item] where root=" + root.ToString() + " order by range desc");
            if (dt.Rows.Count > 0)
            {
                newRange = Val(dt.Rows[0]["range"]) + 1;
            }
            return newRange;
        }

        public bool edit()
        {
            bool success = true;
            log = "";
            string sqlQuery = "update [item] set [title]=?,url=?,other_url=?,icon=?, s_id=?, part_no=? , chapter=? where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("title", title));
            OleDbParameters.Add(new OleDbParameter("url", url));
            OleDbParameters.Add(new OleDbParameter("other_url", other_url));
            OleDbParameters.Add(new OleDbParameter("icon", icon));
            OleDbParameters.Add(new OleDbParameter("s_id", s_id));
            OleDbParameters.Add(new OleDbParameter("part_no", part_no));
            OleDbParameters.Add(new OleDbParameter("chapter", (chapter.HasValue ? chapter.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("num", num));
            success = sql.execute(sqlQuery, OleDbParameters);
            log = sql.log;

            return success;
        }

        public bool del()
        {
            bool success = true;
            log = "";
            string sqlQuery = "delete from [item] where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("num", num));
            success = sql.execute(sqlQuery, OleDbParameters);           
            log = sql.log;
            if (success)
            {
                delSub(num,1);
            }
            return success;
        }

        public bool delNums(string[] nums)
        {
            bool success = true;
            log = "";
            if (nums.Length > 0)
            {
                string sqlQuery = "delete from [item] where num in (" + string.Join(",", nums) + ")";
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

        protected void delSub(int root, int level)  //刪除下一層
        {
            bool isLastLevel = (level + 1 > maxLevel);
            string sqlQuery = "select num from [item] where root=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("root", root));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                sqlQuery = "delete from [item] where root=?";
                OleDbParameters.Clear();
                OleDbParameters.Add(new OleDbParameter("root", root));
                sql.execute(sqlQuery, OleDbParameters);

                foreach (DataRow row in dt.Rows)
                {
                    if (!isLastLevel) { delSub(Val(row["num"]), level +1); }                  
                }

            }
        }

        public bool sort(string nums)
        {
            bool success = true;
            log="";

            if (!isStrNull(nums)){
                string[] num = nums.Split(',');
                for (int r = 0; r < num.Length; r++)
                {
                    string sqlQuery = "update [item] set range=? where num=?";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("range", r));
                    OleDbParameters.Add(new OleDbParameter("num", num[r]));
                    success = sql.execute(sqlQuery, OleDbParameters);
                    if (!success)
                    {
                        log = sql.log;
                        break;
                    }
                }
            }
            else
            {
                success = false;
                log = "無排序資料";
            }

            return success;
        }
            

    }
}

///1.15.0216@SEO模組

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


public interface SEOToUCMeta
{
    void SEOInfoGet(ez.data.seo.DataInfo SEO_Info);
}


namespace ez.data
{
    public class seo : ez.function
    {
        ez.sql sql = new ez.sql();
        public string log;
        private string _category;
        public DataInfo Data;
        public string dbTableName = "seo";

        public seo(string category)   //初始化
        {
            _category = category;
        }

        #region 資料型別

        public struct DataInfo
        {
            public int num;
            public string title;
            public string keyword;
            public string description;
            public string otherMeta;
            public string image;
            public string url;
            public string page_head_code;
        }

        #endregion

        #region 讀取

        public bool Load(int num)
        {
            bool success = true;
            log = "";

            Data = new DataInfo();
            string sqlQuery = "select * from [" + dbTableName + "] where num=? and category=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("num", num));
            OleDbParameters.Add(new OleDbParameter("category", _category));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                Data.num = Val(row["num"]);
                Data.title = ValString(row["title"]);
                Data.keyword = ValString(row["keyword"]);
                Data.description = ValString(row["description"]);
                Data.page_head_code = ValString(row["page_head_code"]);
            }
            else
            {
                Data.num = num;
                Data.title = "";
                Data.keyword = "";
                Data.description = "";
                Data.page_head_code = "";
                success = false;
            }

            return success;
        }
        
        #endregion

        #region 儲存

        public bool Save()
        {
            bool success = true;
            log = "";

            string sqlQuery = "select num from [" + dbTableName + "] where num=? and category=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("num", Data.num));
            OleDbParameters.Add(new OleDbParameter("category", _category));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);

            Data.title = Data.title.Replace("\"", " ");
            Data.keyword = Data.keyword.Replace("\"", " ");
            Data.description = Data.description.Replace("\"", " ");
            Data.page_head_code = Data.page_head_code.Replace("\"", " ");

            if (dt.Rows.Count > 0)
            {
                string column = "title,keyword,description,page_head_code";
                sqlQuery = "update [" + dbTableName + "] set " + sql.mark2(column) + " where num=? and category=?";
                OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("title", ValString(Data.title)));
                OleDbParameters.Add(new OleDbParameter("keyword", ValString(Data.keyword)));
                OleDbParameters.Add(new OleDbParameter("description", ValString(Data.description)));
                OleDbParameters.Add(new OleDbParameter("page_head_code", ValString(Data.page_head_code)));
                OleDbParameters.Add(new OleDbParameter("num", Data.num));
                OleDbParameters.Add(new OleDbParameter("category", _category));
                success = sql.execute(sqlQuery, OleDbParameters);
                log = sql.log;
            }
            else
            {
                string column = "num,category,title,keyword,description,page_head_code";
                sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
                OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", Data.num));
                OleDbParameters.Add(new OleDbParameter("category", _category));
                OleDbParameters.Add(new OleDbParameter("title", ValString(Data.title)));
                OleDbParameters.Add(new OleDbParameter("keyword", ValString(Data.keyword)));
                OleDbParameters.Add(new OleDbParameter("description", ValString(Data.description)));
                OleDbParameters.Add(new OleDbParameter("page_head_code", ValString(Data.page_head_code)));
                success = sql.execute(sqlQuery, OleDbParameters);
                log = sql.log;
            }

            return success;
        }
        
        #endregion

        #region 刪除

        public bool Del(int num)
        {
            int[] nums = { num };
            return Del(nums);
        }

        public bool Del(int[] nums)
        {
            bool success = true;
            log = "";

            string sqlQuery = "delete from [" + dbTableName + "] where num in (" + string.Join(",", nums) + ") and category=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("category", _category));
            success = sql.execute(sqlQuery, OleDbParameters);
            log = sql.log;

            return success;
        }

        #endregion
     
        
    }

}
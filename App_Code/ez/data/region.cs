///1.19.0128@地區模組

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
using OfficeOpenXml.FormulaParsing.Excel.Functions.DateTime;
using Microsoft.Ajax.Utilities;
using System.Drawing.Drawing2D;

/// <summary>
/// region 的摘要描述
/// </summary>

namespace ez.data
{
    public class region : ez.function
    {
        ez.sql sql = new ez.sql();

        #region 主檔

        public int LevelMax = 2;                    //分類層數
        public string dbTableName = "region";  //資料表名稱
        public string[] areaValue = { "北部", "中部", "南部" };   //分類
        public string[] area2Value = { "北區", "中區", "東區", "南區", "離島" };   //分類2
        public string[] populationValue = { "2|1-2人", "4|3-4人", "5|5人以上" };

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
            public string zip;
            public int? root;
            public int? range;
            public int? area;
            public int? area2;
        }

        #endregion

        #region 選項

        public void InitOptions(Control obj, int root, string nation)
        {
            if (!isStrNull(nation))
            {
                DataTable dt = RowDataTable(root, nation);
                if (dt.Rows.Count > 0)
                {
                    foreach (DataRow row in dt.Rows)
                    {
                        if (obj is CheckBoxList) { ((CheckBoxList)obj).Items.Add(new ListItem(row["kind"].ToString(), row["num"].ToString())); }
                        else if (obj is DropDownList) { ((DropDownList)obj).Items.Add(new ListItem(row["kind"].ToString(), row["num"].ToString())); }
                        else if (obj is RadioButtonList) { ((RadioButtonList)obj).Items.Add(new ListItem(row["kind"].ToString(), row["num"].ToString())); }
                    }
                }
            }
        }

        public void initAreaOptions(Control obj)
        {
            if (areaValue.Length > 0)
            {
                int index = 0;
                foreach (string area in areaValue)
                {
                    ListItem ListItem = new ListItem(area, index.ToString());
                    if (obj is CheckBoxList) { ((CheckBoxList)obj).Items.Add(ListItem); }
                    else if (obj is DropDownList) { ((DropDownList)obj).Items.Add(ListItem); }
                    else if (obj is RadioButtonList) { ((RadioButtonList)obj).Items.Add(ListItem); }
                    index++;
                }
            }
        }

        public void initArea2Options(Control obj)
        {
            if (area2Value.Length > 0)
            {
                int index = 0;
                foreach (string area in area2Value)
                {
                    ListItem ListItem = new ListItem(area, index.ToString());
                    if (obj is CheckBoxList) { ((CheckBoxList)obj).Items.Add(ListItem); }
                    else if (obj is DropDownList) { ((DropDownList)obj).Items.Add(ListItem); }
                    else if (obj is RadioButtonList) { ((RadioButtonList)obj).Items.Add(ListItem); }
                    index++;
                }
            }
        }

        public void initPopulationOptions(Control obj)
        {
            if (populationValue.Length > 0)
            {
                foreach (string population in populationValue)
                {
                    string[] p = population.Split('|');
                    ListItem ListItem = new ListItem(p[1], p[0]);
                    if (obj is CheckBoxList) { ((CheckBoxList)obj).Items.Add(ListItem); }
                    else if (obj is DropDownList) { ((DropDownList)obj).Items.Add(ListItem); }
                    else if (obj is RadioButtonList) { ((RadioButtonList)obj).Items.Add(ListItem); }
                }
            }
        }

        public string populationText(int value)
        {
            foreach (string population in populationValue)
            {
                string[] p = population.Split('|');
                if (value == Val(p[0])) { return p[1]; }
            }
            return null;
        }

        #endregion

        #region 讀取

        public string getText(int? Value)
        {
            string kind = "";
            if (Value.HasValue)
            {
                string sqlQuery = "select kind from [" + dbTableName + "] where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", Value));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0) { kind = ValString(dt.Rows[0]["kind"]); }
            }
            return kind;
        }

        public string getText(int[] Values, string Interval = "、")
        {
            string kind = "";
            if (Values.Length > 0)
            {
                foreach (int Value in Values)
                    kind += (!isStrNull(kind) ? Interval : "") + getText(Value);
            }
            return kind;
        }

        public string getZip(int? Value)
        {
            string zip = "";
            if (Value.HasValue)
            {
                string sqlQuery = "select zip from [" + dbTableName + "] where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", Value));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0) { zip = ValString(dt.Rows[0]["zip"]); }
            }
            return zip;
        }

        public int? getArea(int type, int Value)
        {
            string sqlQuery = "select area" + (type == 2 ? "2" : "") + " from [" + dbTableName + "] where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("num", Value));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                if (IsNumeric(dt.Rows[0][0]))
                    return Val(dt.Rows[0][0]);
            }
            return null;
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
                Data.zip = ValString(row["zip"]);
                Data.root = Val(row["root"]);
                Data.range = Val(row["range"]);
                if (!isStrNull(row["area"])) { Data.area = Val(row["area"]); }
                if (!isStrNull(row["area2"])) { Data.area2 = Val(row["area2"]); }
            }
            log = sql.log;

            if (!isStrNull(log))
            {
                success = false;
            }

            return success;
        }

        public DataTable RowDataTable(int root, string nation, int? type = null, int? area = null)
        {
            if (kindNation != nation)
            {
                kindNation = nation;
                string sqlQuery = "select num,kind,root,zip,area,area2 from [" + dbTableName + "] where nation=? order by root,range";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("nation", nation));
                kindDt = sql.selectTable(sqlQuery, OleDbParameters);
            }
            DataTable dt = new DataTable();
            if (kindDt.Rows.Count > 0)
            {
                foreach (DataColumn item in kindDt.Columns)
                    dt.Columns.Add(item.ColumnName, item.DataType);

                string area_sql = "";
                if (type.HasValue && area.HasValue) { area_sql = " and area" + (type.Value == 2 ? "2" : "") + "=" + area.Value.ToString(); }
                DataRow[] trs = kindDt.Select("root=" + root.ToString() + area_sql);
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
                    Data.zip = ValString(row["zip"]);
                    rows.Add(Data);
                }
            }

            return rows;
        }

        #endregion

        #region 新增

        public bool Add()
        {
            bool success = true;
            log = "";

            if (!Data.root.HasValue) { Data.root = 0; }
            if (!Data.range.HasValue) { Data.range = NewRange(Data.root.Value, Data.nation); }

            string column = "nation,area,area2,kind,zip,root,range";
            string sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", ValString(Data.nation)));
            OleDbParameters.Add(new OleDbParameter("area", (Data.area.HasValue ? Data.area.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("area2", (Data.area2.HasValue ? Data.area2.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("kind", ValString(Data.kind)));
            OleDbParameters.Add(new OleDbParameter("zip", ValString(Data.zip)));
            OleDbParameters.Add(new OleDbParameter("root", Data.root.Value));
            OleDbParameters.Add(new OleDbParameter("range", Data.range.Value));
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

            string sqlQuery = "update [" + dbTableName + "] set area=?, area2=?, kind=?, zip=? where num=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("area", (Data.area.HasValue ? Data.area.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("area2", (Data.area2.HasValue ? Data.area2.Value : (object)DBNull.Value)));
            OleDbParameters.Add(new OleDbParameter("kind", ValString(Data.kind)));
            OleDbParameters.Add(new OleDbParameter("zip", ValString(Data.zip)));
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

        #endregion

        #region 居住地年平均用電設定

        public class use : ez.function
        {
            ez.sql sql = new ez.sql();
            public string log;
            public DataInfo Data;
            public string dbTableName = "region_use";

            #region 資料型別

            public struct DataInfo
            {
                public string nation;
                public int area;
                public int population;
                public float? value;
            }

            #endregion

            #region 讀取

            public List<DataInfo> List(string nation)
            {
                List<DataInfo> list = new List<DataInfo>();

                string sqlQuery = "select * from [" + dbTableName + "] where nation=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("nation", nation));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    foreach (DataRow row in dt.Rows)
                    {
                        Data = new DataInfo();
                        Data.nation = nation;
                        Data.area = Val(row["area"]);
                        Data.population = Val(row["population"]);
                        if (!isStrNull(row["value"]))
                            Data.value = ValFloat(row["value"]);
                        list.Add(Data);
                    }
                }

                return list;
            }

            #endregion

            #region 儲存

            public bool Save(List<DataInfo> list)
            {
                bool success = true;
                log = "";

                foreach (DataInfo d in list)
                {
                    string sqlQuery = "select * from [" + dbTableName + "] where nation=? and area=? and population=?";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("nation", d.nation));
                    OleDbParameters.Add(new OleDbParameter("area", d.area));
                    OleDbParameters.Add(new OleDbParameter("population", d.population));
                    DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                    if (dt.Rows.Count > 0)
                    {
                        string column = "value";
                        sqlQuery = "update [" + dbTableName + "] set " + sql.mark2(column) + " where nation=? and area=? and population=?";
                        OleDbParameters = new ArrayList();
                        OleDbParameters.Add(new OleDbParameter("value", (d.value.HasValue ? d.value.Value : (object)DBNull.Value)));
                        OleDbParameters.Add(new OleDbParameter("nation", d.nation));
                        OleDbParameters.Add(new OleDbParameter("area", d.area));
                        OleDbParameters.Add(new OleDbParameter("population", d.population));
                        success = sql.execute(sqlQuery, OleDbParameters);
                        log = sql.log;
                    }
                    else
                    {
                        string column = "value,nation,area,population";
                        sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
                        OleDbParameters = new ArrayList();
                        OleDbParameters.Add(new OleDbParameter("value", (d.value.HasValue ? d.value.Value : (object)DBNull.Value)));
                        OleDbParameters.Add(new OleDbParameter("nation", d.nation));
                        OleDbParameters.Add(new OleDbParameter("area", d.area));
                        OleDbParameters.Add(new OleDbParameter("population", d.population));
                        success = sql.execute(sqlQuery, OleDbParameters);
                        log = sql.log;
                    }
                }

                return success;
            }

            #endregion

            #region 年平均用電

            public DataInfo average(string nation, float value, int area, int population)
            {
                DataInfo data = new DataInfo();
                List<DataInfo> list = List(nation);
                if (area > 0 && population > 0)
                {
                    data = list.Where(w => w.area == area && w.population >= population).OrderBy(o => o.population).FirstOrDefault();
                }
                else
                    data = list.Where(w => w.area == 0 && w.population == 0).FirstOrDefault();
                return data;
            }

            #endregion
        }

        #endregion
    }
}

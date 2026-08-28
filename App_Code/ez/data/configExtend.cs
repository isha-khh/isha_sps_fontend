///1.15.0401@擴充設定模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;

/// <summary>
/// configExtend 的摘要描述
/// </summary>


public interface ConfigExtendUC
{
    void GetMode(bool IsDesginMode);
    void SaveConfig();
}


namespace ez.data
{
    public class configExtend:function
    {

        protected string category;
        public configExtend(string category)
        {
            this.category = category;
        }

        ez.sql sql = new ez.sql();

        public struct SetOption
        {
            public string parameter;
            public string data;
        }


        #region 取得設定表

        public DataTable GetSetView(string[] parameters)
        {
            DataTable SetView = new DataTable();
            if (parameters.Length > 0)
            {
                foreach (string parameter in parameters)
                {
                    SetView.Columns.Add(parameter);
                }

                string sqlQuery = "select [parameter],[data] from [config_extend] where [category]=? and ([parameter]='" + string.Join("' or [parameter]='", parameters) + "')";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("category", category));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    DataRow SetTR = SetView.NewRow();
                    foreach (string parameter in parameters)
                    {
                        SetTR[parameter] = "";
                        foreach (DataRow row in dt.Rows)
                        {
                            if (ValString(row["parameter"]) == parameter)
                            {
                                SetTR[parameter] = ValString(row["data"]);
                                break;
                            }
                        }      
                    }                           
                    SetView.Rows.Add(SetTR);
                }

            }
            return SetView;
        }

        public string GetSetValue(string parameter)
        {
            string Value = "";
            if (!isStrNull(HttpContext.Current.Application[SC + "_" + category + "_" + parameter]))
            {
                try
                {
                    Value = HttpContext.Current.Application[SC + "_" + category + "_" + parameter].ToString();
                }
                catch (Exception)
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "_" + category + "_" + parameter] = null;
                    HttpContext.Current.Application.UnLock();
                }
               
            }

            if (isStrNull(HttpContext.Current.Application[SC + "_" + category + "_" + parameter]))
            {
                string sqlQuery = "select [data] from [config_extend] where [category]=? and [parameter]=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("category", category));
                OleDbParameters.Add(new OleDbParameter("parameter", parameter));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    Value = ValString(dt.Rows[0]["data"]);
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "_" + category + "_" + parameter] = Value;
                    HttpContext.Current.Application.UnLock();
                }
            }           
            
            return Value;
        }

        #endregion

        #region 儲存設定表

        public void SaveSetView(List<SetOption> Options)
        {
            foreach (SetOption Option in Options)
            {

                string SelectCommend = "select [parameter] from [config_extend]  where [category]=? and [parameter]=?";
                ArrayList SelectParameters = new ArrayList();
                SelectParameters.Add(new OleDbParameter("category", category));
                SelectParameters.Add(new OleDbParameter("parameter", Option.parameter));

                string InsertCommend = "insert into [config_extend]  ([category],[parameter],[data]) values (?,?,?)";
                ArrayList InsertParameters = new ArrayList();
                InsertParameters.Add(new OleDbParameter("category", category));
                InsertParameters.Add(new OleDbParameter("parameter", Option.parameter));
                InsertParameters.Add(new OleDbParameter("data", Option.data));

                string UpdateCommend = "update [config_extend] set [data]=?  where [category]=? and [parameter]=?";
                ArrayList UpdateParameters = new ArrayList();
                UpdateParameters.Add(new OleDbParameter("data", Option.data));
                UpdateParameters.Add(new OleDbParameter("category", category));
                UpdateParameters.Add(new OleDbParameter("parameter", Option.parameter));

                if (sql.executeIf(SelectCommend, SelectParameters, InsertCommend, InsertParameters, UpdateCommend, UpdateParameters))
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "_" + category + "_" + Option.parameter] = null;
                    HttpContext.Current.Application.UnLock();
                }

            }
       
        }

        #endregion

    }
}

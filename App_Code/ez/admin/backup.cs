///1.15.0224@備份模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;

/// <summary>
/// backup 的摘要描述
/// </summary>


namespace ez.admin
{
    public class backup : function
    {

        public const string path = "~/App_Data";
        public string log = "";
        public string dbName = "";

        public backup()
        {
            sql sql = new sql();
            if (sql.db.ToLower().IndexOf(".mdb") > -1)
            {
                string[] ds = sql.db.Split('|');
                foreach (string d in ds)
                {
                    if (d.ToLower().IndexOf(".mdb") > -1) 
                    {
                        dbName = d.ToLower();
                        break;
                    }
                }
            }
        }

        public bool Execute()
        {
            bool success = false;
            log = "";
         

            FileInfo File = new FileInfo(Server.MapPath(path + "/" + dbName));
            if (File.Exists)
            {
                try
                {
                    string newName = dbName.Replace(".mdb", "_" + Now().ToString("yyyyMMddHHmmss") + ".mdb");
                    File.CopyTo(Server.MapPath(path + "/" + newName), true);
                    success = true;
                }
                catch (Exception ex)
                {
                    log = ex.Message;               
                }             
            }
            else
            {
                log = "找不到Access資料庫";
            }

            return success;
        }

        public bool Restore(string RestorePath)
        {
            bool success = false;
            log = "";

            if (RestorePath.IndexOf("~/") > -1) { RestorePath = Server.MapPath(RestorePath); }

            FileInfo File = new FileInfo(RestorePath);
            if (File.Exists)
            {
                try
                {
                    File.CopyTo(Server.MapPath(path + "/" + dbName), true);
                    success = true;
                }
                catch (Exception ex)
                {
                    log = ex.Message;
                }      
            }
            else
            {
                log = "找不到指定資料庫";
            }

            return success;
        }

        public struct DataInfo
        {
            public string Name;
            public string FullName;
            public string Time;
        }

        public List<DataInfo> List()
        {
            List<DataInfo> dt = new List<DataInfo>();        
            DirectoryInfo Dir = new DirectoryInfo(Server.MapPath(path));
            if (Dir.Exists)
            {
                FileInfo[] Files = Dir.GetFiles();
                foreach (FileInfo File in Files)
                {
                    if (File.Name.ToLower().IndexOf(".mdb") > -1)
                    {
                        string[] fn = File.Name.Split('.')[0].Split('_');
                        if (fn.Length == 2 && fn[1].Length == 14)
                        {
                            DataInfo tr = new DataInfo();
                            tr.Name = File.Name;
                            tr.FullName = File.FullName;
                            tr.Time = CDateTime(fn[1]);
                            dt.Add(tr);
                        }
                    }
                }
            }

            return dt;
        }

        public bool Del(string[] DelPaths)
        {
            bool success = true;
            log = "";

            foreach (string DelPathx in DelPaths)
            {
                string DelPath = DelPathx;
                if (DelPath.IndexOf("~/") > -1) { DelPath = Server.MapPath(DelPath); }
                FileInfo File = new FileInfo(DelPath);
                if (File.Exists)
                {
                    try
                    {
                        File.Delete();                        
                    }
                    catch (Exception ex)
                    {
                        success = false;
                        if (log == "") { log = ex.Message; }                    
                    }
                }           
            }        

            return success;
        }

       

    }
}

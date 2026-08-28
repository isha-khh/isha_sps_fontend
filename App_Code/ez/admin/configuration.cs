///1.15.0311@WRP組態模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml;
using System.IO;
using System.Collections;
using System.Data;
using System.Data.OleDb;

namespace ez.admin
{
    public class configuration : ez.function
    {

        public struct Info
        {
            public string Version;                          //ezweb版本     
            public string WrpWeb;                     //WRP的網址
            public string WrpManual;                     //操作手冊
            public string WrpApiUrl;                     //WRP的API網址
            public string WrpApiClient;               //WRP的客戶API
            public string WrpApiImportant;       //WRP的重要訊息API        
            public string WrpApiUpdate;       //WRP的模組更新API  
        
        }

        public Info Data;

        public void Load()
        {
            XmlDocument xmlDoc = new XmlDocument();
            xmlDoc.LoadXml(ReadFileContent("~/App_Xml/config.xml"));

            //版本
            XmlNodeList elemList = xmlDoc.DocumentElement.GetElementsByTagName("Version");
            Data.Version = elemList[0].InnerText;
                    
            //WRP
            elemList = xmlDoc.DocumentElement.GetElementsByTagName("Wrp");
            if (elemList[0].HasChildNodes)
            {
                for (int i = 0; i < elemList[0].ChildNodes.Count; i++)
                {
                    if (elemList[0].ChildNodes[i].Name == "Web") { Data.WrpWeb = elemList[0].ChildNodes[i].InnerText; }
                    if (elemList[0].ChildNodes[i].Name == "Manual") { Data.WrpManual = elemList[0].ChildNodes[i].InnerText; }
                    if (elemList[0].ChildNodes[i].Name == "Url") { Data.WrpApiUrl = elemList[0].ChildNodes[i].InnerText; }
                    if (elemList[0].ChildNodes[i].Name == "API")
                    {
                        if (elemList[0].ChildNodes[i].HasChildNodes)
                        {
                            for (int ii = 0; ii < elemList[0].ChildNodes[i].ChildNodes.Count; ii++)
                            {
                                if (elemList[0].ChildNodes[i].ChildNodes[ii].Name == "Client") { Data.WrpApiClient = elemList[0].ChildNodes[i].ChildNodes[ii].InnerText; }
                                if (elemList[0].ChildNodes[i].ChildNodes[ii].Name == "Important") { Data.WrpApiImportant = elemList[0].ChildNodes[i].ChildNodes[ii].InnerText; }
                                if (elemList[0].ChildNodes[i].ChildNodes[ii].Name == "Update") { Data.WrpApiUpdate = elemList[0].ChildNodes[i].ChildNodes[ii].InnerText; }
                            }
                        }
                    }
                }    
            }
        }

        #region 各模組版本取得

        public struct ModuleInfo
        {
            public string Module;
            public string Ver;
            public string Path;
        }

        public DataTable ModuleVerList(DataTable dt = null, string ModulePath = "~/App_Code")
        {
            if (dt == null)
            {
                dt = new DataTable();
                dt.Columns.Add("Module");
                dt.Columns.Add("Ver");
                dt.Columns.Add("Path");
            }

            if (ModulePath.IndexOf("~/") > -1) { ModulePath = Server.MapPath(ModulePath); }
            DirectoryInfo ModuleDir = new DirectoryInfo(ModulePath);
            FileInfo[] Files = ModuleDir.GetFiles();
            if (Files.Length > 0)
            {
                foreach (FileInfo File in Files)
                {
                    ModuleInfo Info = GetInfo(File.FullName);
                    if (!isStrNull(Info.Module))
                    {
                        DataRow tr = dt.NewRow();
                        tr["Module"] = Info.Module;
                        tr["Ver"] = Info.Ver;
                        tr["Path"] = Info.Path;
                        dt.Rows.Add(tr);
                    }
                }
            }
            DirectoryInfo[] Dirs = ModuleDir.GetDirectories();
            if (Dirs.Length > 0)
            {
                foreach (DirectoryInfo Dir in Dirs) { dt = ModuleVerList(dt, Dir.FullName); }
            }

            return dt;
        }

        protected ModuleInfo GetInfo(string CSPath)
        {
            ModuleInfo Info = new ModuleInfo();
            Info.Module = "";
            Info.Ver = "";
            Info.Path = "";
            using (StreamReader sr = new StreamReader(CSPath))
            {
                string line = sr.ReadLine().Trim();
                if (Left(line, 3) == "///" && line.Split('@').Length == 2)
                {
                    string[] temp = line.Replace("///", "").Split('@');
                    Info.Module = temp[1].Trim();
                    Info.Ver = temp[0].Trim();
                    int c = CSPath.ToLower().IndexOf("app_code");
                    Info.Path = "~/" + Right(CSPath, CSPath.Length - c).Replace("\\", "/");                   
                }
            }
            return Info;
        }

        #endregion

        public string Grade()
        {
            string _Grade = "";
            XmlDocument xmlDoc = new XmlDocument();
            xmlDoc.LoadXml(ReadFileContent("~/App_Xml/customized.xml"));
            XmlNodeList elemList = xmlDoc.DocumentElement.GetElementsByTagName("Grade");
            if (elemList.Count > 0)
            {
                for (int j = 0; j < elemList.Count; j++)
                {
                    for (int i = 0; i < elemList[j].ChildNodes.Count; i++)
                    {
                        if (elemList[j].ChildNodes[i].Name == "Version") { _Grade += elemList[j].ChildNodes[i].InnerText.Trim(); }
                        else if (elemList[j].ChildNodes[i].Name == "Design") { _Grade += elemList[j].ChildNodes[i].InnerText.Trim(); }
                        else if (elemList[j].ChildNodes[i].Name == "Code") { _Grade += elemList[j].ChildNodes[i].InnerText.Trim(); }
                    }
                }
            }
            return _Grade;
        }

        public class Modules
        {
            protected string dbName = "module";
            ez.sql sql = new ez.sql();
            public string log = "";

            public DataTable List()
            {
                string sqlQuery = "select [module] from [" + dbName + "] order by [reg_time]";
                DataTable dt = sql.selectTable(sqlQuery);
                log = sql.log;
                return dt;
            }

            public void Add(string module)
            {               
                string sqlQuery = "insert into [" + dbName + "] ([module]) values (?)";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("module", module));
                sql.execute(sqlQuery, OleDbParameters);
                log =sql.log;
            }

            public void Del(string module)
            {
                string sqlQuery = "delete from [" + dbName + "] where [module]=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("module", module));
                sql.execute(sqlQuery, OleDbParameters);
                log = sql.log;
            }
        }

    }
}

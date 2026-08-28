///1.15.0216@節慶模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;
using System.Web.UI.WebControls;
using System.Xml;
using System.IO;

/// <summary>
/// framesets 的摘要描述
/// </summary>

namespace ez.data
{
    public class framesets : ez.function
    {
         
        public ConfigInfo Config;
        ez.sql sql = new ez.sql();
        public string log;
        const string xmlPath = "~/App_Xml/framesets.xml";
        const string wrpDirPath = "~/ext/framesets";

        public class ConfigInfo
        {
            private string _wrpCssID;
            public string wrpCssID
            {
                get
                {
                    return _wrpCssID;
                }
                set
                {
                    _wrpCssID = value;
                }
            }        

            private string _wrpCssFilePath;  
            public string wrpCssFilePath
            {
                get { 
                    return _wrpCssFilePath;
                }
                set{ 
                    _wrpCssFilePath=value;
                }
            }

            public ConfigInfo()
            {
                _wrpCssID = "";
                _wrpCssFilePath = "";              
            }
        }

        public void Load()
        {            
            log = "";
            try
            {
                Config = new ConfigInfo();
                DataTable dt = XmDataTable(ReadFileContent(xmlPath), "Wrp");                       
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    Config.wrpCssID = ValString(row["CssID"]);
                    Config.wrpCssFilePath = ValString(row["CssFilePath"]);
                    if (isStrNull(Config.wrpCssFilePath)) { Config.wrpCssFilePath = "ext/framesets/style.css"; }
                }
            }
            catch (Exception ex)
            {
                log = ex.Message;           
            }    
        }

        public bool Save()
        {
            bool success = false;
            log = "";

            FileInfo FileInfo = new FileInfo(Server.MapPath(xmlPath));
            if (FileInfo.Exists)
            {
                XmlTextWriter xmlWriter = new XmlTextWriter(Server.MapPath(xmlPath), null);
                try
                {                    
                    xmlWriter.WriteStartDocument();
                    xmlWriter.Formatting = Formatting.Indented;
                    xmlWriter.WriteStartElement("Config");
                    xmlWriter.WriteStartElement("Wrp");
                    xmlWriter.WriteElementString("CssID", Config.wrpCssID);
                    xmlWriter.WriteElementString("CssFilePath", Config.wrpCssFilePath);
                    xmlWriter.WriteEndElement();
                    xmlWriter.WriteEndElement();
                    xmlWriter.WriteEndDocument();
                    xmlWriter.Close();
                    success = true;
                }
                catch (Exception ex)
                {
                    log = ex.Message;
                }
                finally
                {
                    xmlWriter.Close();
                }
            }
                        
            return success;
        }
              
        public struct WrpDataInfo
        {
            public string ID;
            public string Title;
            public string Description;
            public string ThumbImg;
            public string CssFile;
        }

        public WrpDataInfo WrpData(string ID)
        {         
            WrpDataInfo WrpData = new WrpDataInfo();
            DataTable dt = WrpRowTable();
            if (dt.Rows.Count > 0)
            {
                foreach (DataRow row in dt.Rows)
                {
                    if (ValString(row["ID"]) == ID)
                    {
                        WrpData.ID = ValString(row["ID"]);
                        WrpData.Title = ValString(row["Title"]);
                        WrpData.Description = ValString(row["Description"]);
                        WrpData.ThumbImg = ValString(row["ThumbImg"]);
                        WrpData.CssFile = ValString(row["CssFile"]);
                        break;
                    }
                }
            }           
            return WrpData;
        }

        public DataTable WrpRowTable()
        {
            DataTable dt = new DataTable();
            dt.Columns.Add("ID");
            dt.Columns.Add("Title");
            dt.Columns.Add("Description");
            dt.Columns.Add("ThumbImg");
            dt.Columns.Add("CssFile");
            DirectoryInfo dirInfo = new DirectoryInfo(Server.MapPath(wrpDirPath));
            if (dirInfo.Exists)
            {
                DirectoryInfo[] subDirs = dirInfo.GetDirectories();
                foreach (DirectoryInfo subDir in subDirs)
                {
                    FileInfo[] subFiles = subDir.GetFiles();
                    if (subFiles.Length > 0)
                    {
                        foreach (FileInfo subFile in subFiles)
                        {
                            if (subFile.Name.ToLower() == "config.xml")
                            {
                                string XmlString = ReadFileContent(wrpDirPath + "/" + subDir.Name + "/" + subFile.Name);
                                
                                try
                                {
                                    XmlDocument xmldoc = new XmlDocument();
                                    xmldoc.LoadXml(XmlString);                                               
                                    XmlNodeList elemLists = xmldoc.GetElementsByTagName("xml");                                 
                                    foreach (XmlNode elemList in elemLists)
                                    {
                                        if (elemList.Attributes["type"].Value == "frameset")
                                        {                                          
                                            if (elemList.HasChildNodes)
                                            {

                                                DataRow row = dt.NewRow();
                                                row["ID"] = elemList.Attributes["id"].Value;
                                                foreach (XmlNode elemList2 in elemList.ChildNodes)
                                                {
                                                    if (elemList2.Name == "title") {  row["Title"]  = elemList2.InnerText.Trim(); }
                                                    else if (elemList2.Name == "description") { row["Description"] = elemList2.InnerText.Trim(); }
                                                    else if (elemList2.Name == "img")
                                                    {
                                                        if (elemList2.Attributes["id"].Value == "thumb") { 
                                                            row["ThumbImg"] = wrpDirPath.Replace("~/", "") + "/" + subDir.Name + "/" + elemList2.Attributes["src"].Value;
                                                        }
                                                    }
                                                    else if (elemList2.Name == "assets")
                                                    {
                                                        if (elemList2.HasChildNodes)
                                                        {
                                                            foreach (XmlNode elemList3 in elemList2.ChildNodes)
                                                            {
                                                                if (elemList3.Name == "file")
                                                                {
                                                                    if (elemList3.Attributes["id"].Value == "cssfile")
                                                                    {
                                                                        row["CssFile"] = wrpDirPath.Replace("~/", "") + "/" + subDir.Name + "/" + elemList3.Attributes["href"].Value;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                dt.Rows.Add(row);
                                            }
                                           
                                        }
                                    }

                                }
                                catch (Exception ex)
                                {
                                    //throw;
                                }
                                break;
                            }
                        }
                    }
                }
            }
            return dt;
        }  

    }
}

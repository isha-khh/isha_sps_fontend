///1.15.0216@UC插件模組

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
/// widgets 的摘要描述
/// </summary>
/// 
namespace ez.data
{
    public class widgets : ez.function
    {
        
        const string xmlUserControlPath = "~/ext/widgets";
        const string xmlPathAll = "~/App_Xml/widgets.xml";
        const string xmlPathDir = "~/App_Xml/widgets";

        public ConfigInfo Config;
        public string log;

        public DataTable UserControlTable()
        {

            DataTable dt = new DataTable();
            dt.Columns.Add("ID");
            dt.Columns.Add("Title");
            dt.Columns.Add("Description");
            dt.Columns.Add("ThumbImg");
            dt.Columns.Add("File");
            DirectoryInfo dirInfo = new DirectoryInfo(Server.MapPath(xmlUserControlPath));
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
                                string XmlString = ReadFileContent(xmlUserControlPath + "/" + subDir.Name + "/" + subFile.Name);

                                try
                                {
                                    XmlDocument xmldoc = new XmlDocument();
                                    xmldoc.LoadXml(XmlString);
                                    XmlNodeList elemLists = xmldoc.GetElementsByTagName("xml");
                                    foreach (XmlNode elemList in elemLists)
                                    {
                                        if (elemList.Attributes["type"].Value == "widgets")
                                        {
                                            if (elemList.HasChildNodes)
                                            {

                                                DataRow row = dt.NewRow();
                                                row["ID"] = elemList.Attributes["id"].Value;
                                                foreach (XmlNode elemList2 in elemList.ChildNodes)
                                                {
                                                    if (elemList2.Name == "title") { row["Title"] = elemList2.InnerText.Trim(); }
                                                    else if (elemList2.Name == "description") { row["Description"] = elemList2.InnerText.Trim(); }
                                                    else if (elemList2.Name == "img")
                                                    {
                                                        if (elemList2.Attributes["id"].Value == "thumb")
                                                        {
                                                            row["ThumbImg"] = xmlUserControlPath.Replace("~/", "") + "/" + subDir.Name + "/" + elemList2.Attributes["src"].Value;
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
                                                                    if (elemList3.Attributes["id"].Value == "control")
                                                                    {
                                                                        row["File"] = xmlUserControlPath.Replace("~/", "") + "/" + subDir.Name + "/" + elemList3.Attributes["href"].Value;
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

        public DataTable widgetsTable(string path, string tag)
        {
            DataTable dt = new DataTable();
            FileInfo FileInfo = new FileInfo(Server.MapPath(path));
            if (FileInfo.Exists)
            {
                //log = Server.MapPath(path);
                dt = XmDataTable(ReadFileContent(path), tag);              
            }           
            return dt;
        }


        public class ConfigInfo
        {
            private ArrayList _side1_bottom_widgets;
            public ArrayList side1_bottom_widgets
            {
                get { return _side1_bottom_widgets; }
                set { _side1_bottom_widgets = value; }
            }

            private ArrayList _side2_bottom_widgets;
            public ArrayList side2_bottom_widgets
            {
                get { return _side2_bottom_widgets; }
                set { _side2_bottom_widgets = value; }
            }

            public ConfigInfo()
            {
                _side1_bottom_widgets = new ArrayList();
                _side2_bottom_widgets = new ArrayList();
            }
        }


        public bool Save(string category)
        {
            bool success = false;
            log = "";

            string loadXmlPath = xmlPathAll;
            if (category == "*")
            {
                //清除其它設定
                DirectoryInfo dirInfo = new DirectoryInfo(Server.MapPath(xmlPathDir));
                if (dirInfo.Exists)
                {
                    FileInfo[] subFiles = dirInfo.GetFiles();
                    if (subFiles.Length > 0)
                    {
                        foreach (FileInfo subFile in subFiles)
                        {
                            try
                            {
                                subFile.Delete();
                            }
                            catch (Exception ex)
                            {
                                log = ex.Message;
                            }
                        }
                    }
                }
            }
            else
            {
                category = category.Replace("/", "_");
                loadXmlPath = xmlPathDir + "/" + category + ".xml";               
            }

            
            XmlTextWriter xmlWriter = new XmlTextWriter(Server.MapPath(loadXmlPath), null);
            try
            {
                xmlWriter.WriteStartDocument();
                xmlWriter.Formatting = Formatting.Indented;
                xmlWriter.WriteStartElement("Config");
                xmlWriter.WriteStartElement("Widgets");
                if (Config.side1_bottom_widgets.Count > 0)
                {
                    foreach (string dOption in Config.side1_bottom_widgets)
                    {
                        xmlWriter.WriteStartElement("side1_bottom_widgets");
                        xmlWriter.WriteElementString("File", dOption);
                        xmlWriter.WriteEndElement();
                    }
                }
                if (Config.side2_bottom_widgets.Count > 0)
                {
                    foreach (string dOption in Config.side2_bottom_widgets)
                    {
                        xmlWriter.WriteStartElement("side2_bottom_widgets");
                        xmlWriter.WriteElementString("File", dOption);
                        xmlWriter.WriteEndElement();
                    }
                }

                xmlWriter.WriteEndElement();
                xmlWriter.WriteEndElement();
                xmlWriter.WriteEndDocument();
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


            return success;
        }

        public void Load(string category)
        {

            
            string loadXmlPath = xmlPathAll;
            if (category != "*")
            {
                category = category.Replace("/", "_");
                loadXmlPath = xmlPathDir + "/" + category + ".xml";
                FileInfo FileInfo = new FileInfo(Server.MapPath(loadXmlPath));
                if (!FileInfo.Exists) { loadXmlPath = xmlPathAll; }
            }           
            Config = new ConfigInfo();
            
            DataTable dt = widgetsTable(loadXmlPath,"side1_bottom_widgets");
            if (dt.Rows.Count > 0)
            {
                foreach (DataRow row in dt.Rows)
                {
                    Config.side1_bottom_widgets.Add(row["File"].ToString());
                }              
            }

            dt = widgetsTable(loadXmlPath, "side2_bottom_widgets");
            if (dt.Rows.Count > 0)
            {
                foreach (DataRow row in dt.Rows)
                {
                    Config.side2_bottom_widgets.Add(row["File"].ToString());
                }
            }
                      
         
        }

       

    }
}

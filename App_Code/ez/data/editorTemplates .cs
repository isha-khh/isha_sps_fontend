///1.15.0216@ckEditor樣板模組

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
using System.Web.UI;

/// <summary>
/// widgets 的摘要描述
/// </summary>
/// 
namespace ez.data
{
    public class editorTemplates : ez.function
    {
        //ez:ym:參考widgets.cs
        const string xmlUserControlPath = "~/ext/editor_templates";
        //const string xmlPathAll = "~/App_Xml/widgets.xml";
        //const string xmlPathDir = "~/App_Xml/widgets";

        public ConfigInfo Config;
        public string log;

        public DataTable UserControlTable(string kind = "")
        {

            DirectoryInfo dirInfo = new DirectoryInfo(Server.MapPath(xmlUserControlPath));
            DataTable dt = new DataTable();
            dt.Columns.Add("ID");
            dt.Columns.Add("Title");
            dt.Columns.Add("Description");
            dt.Columns.Add("ThumbImg");
            dt.Columns.Add("File");
            dt.Columns.Add("CssFile");
            if (dirInfo.Exists)
            {
                DirectoryInfo[] subDirs = dirInfo.GetDirectories();
                if (!isStrNull(kind))
                    subDirs = dirInfo.GetDirectories(kind + ".*");
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
                                        if (elemList.Attributes["type"].Value == "editor")
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
                                                                    if (elemList3.Attributes["id"].Value == "css")
                                                                    {
                                                                        row["CssFile"] = xmlUserControlPath.Replace("~/", "") + "/" + subDir.Name + "/" + elemList3.Attributes["href"].Value;
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

        public string getJson(string kind = "")
        {
            string root = VirtualPathUtility.ToAbsolute("~/");
            //root = "";
            string r = "";
            DataTable dt = UserControlTable(kind);
            if (dt.Rows.Count > 0)
            {
                r = ("{\"list\":[");
                int n = dt.Rows.Count;
                string s;
                foreach (DataRow row in dt.Rows)
                {
                    //UserControl.Items.Add(new ListItem(row["Title"].ToString(), row["File"].ToString()));
                    n--;
                    s = row["Description"].ToString();
                    s = s.Replace("\r", String.Empty);
                    s = s.Replace("\n", " ");
                    s = s.Replace("\t", " ");
                    r += ("{" +
                            "\"id\":\"" + row["ID"] + "\"," +
                            "\"title\":\"" + row["Title"] + "\"," +
                            "\"description\":\"" + s + "\"," +
                            "\"image\":\"" + "" + row["ThumbImg"] + "\"," +
                            "\"html\":\"" + root + row["File"] + "\"," +
                            "\"htmlsrc\":\"" + root + row["File"] + "\"," +
                            "\"css\":\"" + root + row["CssFile"] + "\"" +
                            "}" + ((n > 0) ? "," : "") + "\r\n");
                }
                r += ("]," +
                    "\"config_file\": \"config.xml\"," +
                    "\"version\": \"1.0\"}");
            }
            return r;
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
    }
}

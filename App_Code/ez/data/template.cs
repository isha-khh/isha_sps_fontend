///1.15.0216@樣版模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml;
using System.IO;
using System.Collections;
using System.Data;

/// <summary>
/// template 的摘要描述
/// </summary>
/// 
namespace ez.data
{
    public class template : ez.function
    {

        public struct DataInfo
        {
            public string AdminTemplate;
            public string WebTemplate;
            public string HomeContent;
        }

        public DataInfo Data = new DataInfo();
        public string log = "";
        public string Dir = "~/upload/template/";   //樣版的背景

        private string XmlPath = "~/App_Xml/template.xml";

        public void Load()
        {
            if (isStrNull(HttpContext.Current.Application[SC + "WebTemplate"]))
            {
                XmlDocument xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(ReadFileContent(XmlPath));

                XmlNodeList elemList = xmlDoc.DocumentElement.GetElementsByTagName("AdminTemplate");
                Data.AdminTemplate = elemList[0].InnerText;

                elemList = xmlDoc.DocumentElement.GetElementsByTagName("WebTemplate");
                Data.WebTemplate = elemList[0].InnerText;

                try
                {
                    elemList = xmlDoc.DocumentElement.GetElementsByTagName("HomeContent");
                    Data.HomeContent = elemList[0].InnerText;
                }
                catch (Exception ex)
                {
                }
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + "WebTemplate"] = Data;
                HttpContext.Current.Application.UnLock();
            }
            else
            {
                try
                {
                    Data = (DataInfo)HttpContext.Current.Application[SC + "WebTemplate"];
                }
                catch (Exception ex)
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "WebTemplate"] = null;
                    HttpContext.Current.Application.UnLock();
                    Load();
                }

            }
          

        }

        public DataTable AdminTemplateList()
        {
            return TemplateList("~/admin/Templates");
        }

        public DataTable WebTemplateList()
        {
            return TemplateList("~/Templates");
        }

        public DataTable TemplateList(string TemplateDirPath)
        {
            DataTable dt = new DataTable();
            dt.Columns.Add("title");
            dt.Columns.Add("description");
            dt.Columns.Add("img");
            dt.Columns.Add("file");
            dt.Columns.Add("HomeContent");

            DirectoryInfo DInfo = new DirectoryInfo(Server.MapPath(TemplateDirPath));
            if (DInfo.Exists)
            {

                DirectoryInfo[] DInfos = DInfo.GetDirectories();
                if (DInfos.Length > 0)
                {
                    foreach (DirectoryInfo DItem in DInfos)
                    {
                        string XmlFilePath = DItem.FullName + "\\config.xml";
                        FileInfo FInfo = new FileInfo(XmlFilePath);
                        if (FInfo.Exists)
                        {

                            DataRow tr = dt.NewRow();

                            XmlDocument xmlDoc = new XmlDocument();
                            xmlDoc.LoadXml(ReadFileContent(XmlFilePath));

                            XmlNodeList elemList = xmlDoc.DocumentElement.GetElementsByTagName("title");
                            tr["title"] = elemList[0].InnerText;

                            elemList = xmlDoc.DocumentElement.GetElementsByTagName("description");
                            tr["description"] = elemList[0].InnerText;

                            elemList = xmlDoc.DocumentElement.GetElementsByTagName("img");
                            for (int i = 0; i < elemList.Count; i++)
                            {
                                if (elemList[i].Attributes["id"].Value == "thumb")
                                {
                                    tr["img"] = elemList[i].Attributes["src"].Value;
                                    break;
                                }
                            }

                            elemList = xmlDoc.DocumentElement.GetElementsByTagName("file");
                            for (int i = 0; i < elemList.Count; i++)
                            {
                                if (elemList[i].Attributes["id"].Value == "control")
                                {
                                    tr["file"] = elemList[i].Attributes["href"].Value;                                    
                                }else if(elemList[i].Attributes["id"].Value == "homeContent")
                                {
                                    tr["HomeContent"] = elemList[i].Attributes["href"].Value;
                                    break;
                                }
                            }

                            dt.Rows.Add(tr);


                        }
                    }
                }

            }

            return dt;
        }

        public bool Save()
        {
            bool success = true;
            log = "";

            XmlTextWriter xmlWriter = new XmlTextWriter(Server.MapPath(XmlPath), null);

            try
            {
               
                xmlWriter.WriteStartDocument();
                xmlWriter.Formatting = Formatting.Indented;
                xmlWriter.WriteStartElement("Config");
        
                xmlWriter.WriteElementString("AdminTemplate", Data.AdminTemplate);     
                xmlWriter.WriteElementString("WebTemplate", Data.WebTemplate);
                xmlWriter.WriteElementString("HomeContent", Data.HomeContent);

                xmlWriter.WriteEndElement();
                xmlWriter.WriteEndDocument();

            }
            catch (Exception ex)
            {
                success = false;
                log = ex.Message;
            }
            finally
            {
                xmlWriter.Close();
            }

            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application[SC + "WebTemplate"] = null;
            HttpContext.Current.Application.UnLock();

            return success;
        }
              


    }
}

///1.17.0714@檔案存取模組

using ICSharpCode.SharpZipLib.Zip;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Net;
using System.Web;
using System.Xml;

/// <summary>
/// fileSystem 的摘要描述
/// </summary>

namespace ez
{
    public class fileSystem : function
    {

        public string log = "";
        public fileSystem(bool ReSetCheck = true)

        {
            if (ReSetCheck)
            {
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + "_CheckCountLimit"] = null;
                HttpContext.Current.Application.UnLock();
            }
        }

        public int Count()
        {
            HttpFileCollection objFileCollection = HttpContext.Current.Request.Files;
            return objFileCollection.Count;
        }

        public string[] Upload(string filePath)
        {

            string up_path = filePath;
            if (filePath.IndexOf("~/") > -1) { up_path = Server.MapPath(filePath); }

            if (up_path.Substring(up_path.Length - 1, 1).ToString() != "/")
            {
                up_path = up_path + "/";
            }

            DirectoryInfo DirectoryInfo = new DirectoryInfo(up_path);
            if (!DirectoryInfo.Exists)
            {
                DirectoryInfo.Create();    //在本機上建資料夾                 
            }

            HttpFileCollection objFileCollection = HttpContext.Current.Request.Files;
            if (objFileCollection.Count > 0 && CheckCountLimit())
            {
                HttpPostedFile file;
                int ii = 0;
                string[] pic_name = new string[objFileCollection.Count];
                for (ii = 0; ii < objFileCollection.Count; ii++)
                {
                    file = objFileCollection[ii];
                    if (file.ContentLength > 0)
                    {
                        string[] n = Path.GetFileName(file.FileName).Split('.');
                        pic_name[ii] = Now().ToString("yyyyMMddHHmmss") + ii.ToString() + "." + n[n.Length - 1];
                        if (isAllowed(pic_name[ii])) { file.SaveAs(up_path + pic_name[ii]); } else { pic_name[ii] = ""; }
                    }
                    else
                    {
                        pic_name[ii] = "";
                    }
                }
                return pic_name;
            }
            else
            {
                int defMax = 99;
                string[] pic_name = new string[defMax];
                for (int i = 0; i < defMax; i++)
                {
                    pic_name[i] = "";
                }
                return pic_name;
            }

        }

        public string[] UploadBase64()
        {

            HttpFileCollection objFileCollection = HttpContext.Current.Request.Files;
            if (objFileCollection.Count > 0 && CheckCountLimit())
            {
                HttpPostedFile file = default(HttpPostedFile);
                int ii = 0;
                string[] pic_name = new string[objFileCollection.Count];
                for (ii = 0; ii < objFileCollection.Count; ii++)
                {
                    file = objFileCollection[ii];
                    if (file.ContentLength > 0)
                    {
                        string[] n = Path.GetFileName(file.FileName).Split('.');
                        string c_type = file_type(n[n.Length - 1].ToLower());
                        if (!isStrNull(c_type))
                        {
                            Stream fs = file.InputStream;
                            BinaryReader br = new BinaryReader(fs);
                            byte[] bytes = br.ReadBytes((int)fs.Length);
                            string base64String = "data:" + c_type + ";base64," + Convert.ToBase64String(bytes, 0, bytes.Length);
                            pic_name[ii] = JsonConvert.SerializeObject(new
                            {
                                name = file.FileName,
                                data = base64String
                            });
                        }
                        else
                        {
                            pic_name[ii] = "";
                        }
                    }
                    else
                    {
                        pic_name[ii] = "";
                    }
                }
                return pic_name;
            }
            else
            {
                int defMax = 99;
                string[] pic_name = new string[defMax];
                for (int i = 0; i <= defMax - 1; i++)
                {
                    pic_name[i] = "";
                }
                return pic_name;
            }

        }

        public string file_type(string file_extension)
        {
            string ctype = "";
            switch (file_extension)
            {
                case "pdf": ctype = "application/pdf"; break;
                case "exe": ctype = "application/octet-stream"; break;
                case "zip": ctype = "application/zip"; break;
                case "docx": ctype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; break;
                case "doc": ctype = "application/msword"; break;
                case "xls": ctype = "application/vnd.ms-excel"; break;
                case "xlsx": ctype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; break;
                case "ppt": ctype = "application/vnd.ms-powerpoint"; break;
                case "pptx": ctype = "application/vnd.openxmlformats-officedocument.presentationml.presentation"; break;
                case "gif": ctype = "image/gif"; break;
                case "png": ctype = "image/png"; break;
                case "jpeg":
                case "jpg": ctype = "image/jpg"; break;
                case "mp3": ctype = "audio/mpeg"; break;
                case "wav": ctype = "audio/x-wav"; break;
                case "mpeg":
                case "mpg":
                case "mpe": ctype = "video/mpeg"; break;
                case "mov": ctype = "video/quicktime"; break;
                case "avi": ctype = "video/x-msvideo"; break;
                default:
                    break;
            }
            return ctype;
        }

        public void Delete(string filePath)
        {
            string path = Server.MapPath(filePath);
            FileInfo FileInfo = new FileInfo(path);
            if (FileInfo.Exists)
            {
                FileInfo.Delete();
            }
        }

        public void DeleteDir(string dirPath)
        {
            string path = dirPath;
            if (dirPath.IndexOf("~/") > -1) { path = Server.MapPath(dirPath); }

            DirectoryInfo DirInfo = new DirectoryInfo(path);
            if (DirInfo.Exists)
            {
                FileInfo[] FileInfos = DirInfo.GetFiles();
                if (FileInfos.Length > 0)
                {
                    foreach (FileInfo FileInfo in FileInfos) { FileInfo.Delete(); }
                }
                DirectoryInfo[] DirInfos = DirInfo.GetDirectories();
                if (DirInfos.Length > 0)
                {
                    foreach (DirectoryInfo _DirInfo in DirInfos)
                    {
                        DeleteDir(_DirInfo.FullName);
                    }
                }
                DirInfo.Delete();
            }
        }

        public bool isPhoto(string fileName)
        {
            string[] n = fileName.ToLower().Split('.');
            string[] type = {
            "jpg",
            "jpeg",
            //"png",
            "tif",
            "bmp"
        };
            for (int i = 0; i <= type.Length - 1; i++)
            {
                if (n[n.Length - 1].Trim() == type[i].Trim())
                {
                    return true;
                }
            }
            return false;
        }

        public bool isAllowed(string fileName)
        {
            string[] n = fileName.ToLower().Split('.');
            string[] type = {
            "jpg",
            "jpeg",
            "png",
            "tif",
            "bmp",
            "gif",
             "pdf",
               "doc",
                 "docx",
                   "xls",
                       "xlsx",
                         "xml", "svg"
        };
            for (int i = 0; i <= type.Length - 1; i++)
            {
                if (n[n.Length - 1].Trim() == type[i].Trim())
                {
                    return true;
                }
            }

            return false;
        }

        public string[] UploadPhoto(string filePath, double widthLimitPx)
        {

            string up_path = filePath;
            if (filePath.IndexOf("~/") > -1) { up_path = Server.MapPath(filePath); }

            if (up_path.Substring(up_path.Length - 1, 1).ToString() != "/")
            {
                up_path = up_path + "/";
            }

            DirectoryInfo DirectoryInfo = new DirectoryInfo(up_path);
            if (!DirectoryInfo.Exists)
            {
                DirectoryInfo.Create();    //在本機上建資料夾                 
            }

            HttpFileCollection objFileCollection = HttpContext.Current.Request.Files;
            if (objFileCollection.Count > 0 && CheckCountLimit())
            {
                HttpPostedFile file = default(HttpPostedFile);
                int ii = 0;
                string[] pic_name = new string[objFileCollection.Count];
                for (ii = 0; ii < objFileCollection.Count; ii++)
                {
                    file = objFileCollection[ii];
                    if (file.ContentLength > 0)
                    {
                        string[] n = Path.GetFileName(file.FileName).Split('.');
                        pic_name[ii] = Now().ToString("yyyyMMddHHmmss") + ii.ToString() + "." + n[n.Length - 1];
                        if (isPhoto(pic_name[ii]))
                        {
                            if (AutoConvertJPG())
                            {
                                pic_name[ii] = pic_name[ii].ToLower().Replace(".bmp", ".jpg");
                                pic_name[ii] = pic_name[ii].ToLower().Replace(".png", ".jpg");
                                pic_name[ii] = pic_name[ii].ToLower().Replace(".tif", ".jpg");
                            }
                            n = pic_name[ii].Split('.');

                            System.Drawing.Image Bm = new System.Drawing.Bitmap(file.InputStream);

                            foreach (PropertyItem pi in Bm.PropertyItems)
                            {
                                // orientation tag id is 274                        
                                if (pi.Id == 274)
                                {
                                    switch (pi.Value[0])
                                    {
                                        case 2:
                                            Bm.RotateFlip(RotateFlipType.RotateNoneFlipX);
                                            break;
                                        case 3:
                                            Bm.RotateFlip(RotateFlipType.Rotate180FlipNone);
                                            break;
                                        case 4:
                                            Bm.RotateFlip(RotateFlipType.RotateNoneFlipY);
                                            break;
                                        case 5:
                                            Bm.RotateFlip(RotateFlipType.Rotate90FlipX);
                                            break;
                                        case 6:
                                            Bm.RotateFlip(RotateFlipType.Rotate90FlipNone);
                                            break;
                                        case 7:
                                            Bm.RotateFlip(RotateFlipType.Rotate270FlipX);
                                            break;
                                        case 8:
                                            Bm.RotateFlip(RotateFlipType.Rotate270FlipNone);
                                            break;
                                        default:
                                            break;
                                    }
                                }
                            }

                            double maxSize = widthLimitPx;
                            //限制最寬尺寸不得超過象素
                            double newWidth = Bm.Width;
                            double newHeight = Bm.Height;
                            if (Bm.Width >= maxSize && maxSize > 0)
                            {
                                newWidth = maxSize;
                                newHeight = maxSize / Bm.Width;
                                newHeight = newHeight * Bm.Height;
                            }

                            System.Drawing.Image New_Image = new Bitmap((int)newWidth, (int)newHeight);
                            Graphics ObjGraphics = Graphics.FromImage(New_Image);
                            ObjGraphics.InterpolationMode = GetInterpolationMode();
                            ObjGraphics.SmoothingMode = GetSmoothingMode();
                            ObjGraphics.CompositingQuality = GetCompositingQuality();
                            string picType = n[n.Length - 1].ToLower();
                            if (picType == "jpg")
                                picType = "jpeg";

                            if (picType == "png")
                            {
                                ObjGraphics.Clear(Color.Transparent);
                                //清空Graphics, 以透明色填充
                            }
                            else
                            {
                                ObjGraphics.Clear(Color.White);
                                //清空Graphics, 以白色填充
                            }

                            //在指定位置按指定大小繪制原圖片的片段
                            ObjGraphics.DrawImage(Bm, new Rectangle(0, 0, (int)newWidth, (int)newHeight), new Rectangle(0, 0, Bm.Width, Bm.Height), GraphicsUnit.Pixel);
                            //下方設定使JPG質量
                            EncoderParameters EPS = new EncoderParameters();
                            EncoderParameter EP = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, GetPicQuality());
                            EPS.Param[0] = EP;
                            ImageCodecInfo[] codecs = ImageCodecInfo.GetImageEncoders();
                            ImageCodecInfo ICI = null;
                            foreach (ImageCodecInfo codec in codecs)
                            {
                                if (codec.MimeType == "image/" + picType)
                                {
                                    ICI = codec;
                                    break; // TODO: might not be correct. Was : Exit For
                                }
                            }
                            New_Image.Save(up_path + pic_name[ii], ICI, EPS);
                            New_Image.Dispose();
                            ObjGraphics.Dispose();

                            Bm.Dispose();
                        }
                        else if (isAllowed(pic_name[ii]))
                        {
                            file.SaveAs(up_path + pic_name[ii]);
                            //若不是圖片直接儲存
                        }
                        else
                        {
                            pic_name[ii] = "";
                        }

                    }
                    else
                    {
                        pic_name[ii] = "";
                    }
                }
                return pic_name;
            }
            else
            {
                int defMax = 99;
                string[] pic_name = new string[defMax];
                for (int i = 0; i <= defMax - 1; i++)
                {
                    pic_name[i] = "";
                }
                return pic_name;
            }

        }

        public struct PicInfo
        {
            public string name;
            public string data;
            public int size;
            public string type;
        }
        public List<PicInfo> Base64()
        {
            List<PicInfo> list = new List<PicInfo>();
            HttpFileCollection objFileCollection = HttpContext.Current.Request.Files;
            if (objFileCollection.Count > 0)
            {
                HttpPostedFile file = default(HttpPostedFile);
                int ii = 0;
                for (ii = 0; ii < objFileCollection.Count; ii++)
                {
                    file = objFileCollection[ii];
                    if (file.ContentLength > 0)
                    {
                        Stream fs = file.InputStream;
                        BinaryReader br = new BinaryReader(fs);
                        byte[] bytes = br.ReadBytes((int)fs.Length);
                        string base64String = Convert.ToBase64String(bytes, 0, bytes.Length);
                        list.Add(new PicInfo() { name = file.FileName, data = "data:" + file.ContentType + ";base64," + base64String, size = file.ContentLength, type = file.ContentType });
                    }
                    else
                    {
                        list.Add(new PicInfo());
                    }
                }
            }
            else
            {
                int defMax = 99;
                for (int i = 0; i <= defMax - 1; i++)
                {
                    list.Add(new PicInfo());
                }
            }
            return list;
        }

        #region FTP

        public struct FtpCredential
        {
            public string Username;
            public string Password;
            public List<string> Source;
            public List<string> Target;
        }

        public bool FtpUpload(FtpCredential FC)
        {
            bool success = true;
            log = "";

            if (FC.Source != null && FC.Target != null && FC.Source.Count == FC.Target.Count)
            {
                for (int i = 0; i < FC.Target.Count; i++)
                {
                    try
                    {
                        FtpWebRequest request = (FtpWebRequest)WebRequest.Create(FC.Target[i]);
                        request.Method = WebRequestMethods.Ftp.UploadFile;
                        request.Credentials = new NetworkCredential(FC.Username, FC.Password);

                        if (FC.Source[i].IndexOf("~/") > -1) { FC.Source[i] = Server.MapPath(FC.Source[i]); }

                        byte[] fileContents = File.ReadAllBytes(FC.Source[i]);
                        request.ContentLength = fileContents.Length;

                        Stream requestStream = request.GetRequestStream();
                        requestStream.Write(fileContents, 0, fileContents.Length);
                        requestStream.Close();

                        FtpWebResponse response = (FtpWebResponse)request.GetResponse();
                        response.Close();
                    }
                    catch (Exception ex)
                    {
                        success = false;
                        log += "<div>" + FC.Source[i] + " to " + FC.Target[i] + "：" + ex.Message + "</div>";
                    }
                }
            }
            else
            {
                success = false;
                log = "來源跟目的的數量不符";
            }

            return success;
        }

        public bool FtpCopySoruce(FtpCredential FC, string SourceDir, string TargetDir, string excludeFile = "update.xml")
        {
            bool success = true;
            string _log = "";

            if (Right(SourceDir, 1) == "/") { SourceDir = Left(SourceDir, SourceDir.Length - 1); }
            if (SourceDir.IndexOf("~/") > -1) { SourceDir = Server.MapPath(SourceDir); }
            if (Right(TargetDir, 1) != "/") { TargetDir = TargetDir + "/"; }


            //取得不能覆蓋的定義
            List<string> NotAllowedDir = new List<string>();
            List<string> NotAllowedFile = new List<string>();

            XmlDocument xmlDoc = new XmlDocument();
            xmlDoc.LoadXml(ReadFileContent("~/App_Xml/customized.xml"));
            XmlNodeList elemList = xmlDoc.DocumentElement.GetElementsByTagName("Dir");
            if (elemList.Count > 0)
            {
                for (int j = 0; j < elemList.Count; j++)
                {
                    for (int i = 0; i < elemList[j].ChildNodes.Count; i++)
                    {
                        if (elemList[j].ChildNodes[i].Name == "DirPath") { NotAllowedDir.Add(elemList[j].ChildNodes[i].InnerText.Trim()); }
                    }
                }
            }
            elemList = xmlDoc.DocumentElement.GetElementsByTagName("File");
            if (elemList.Count > 0)
            {
                for (int j = 0; j < elemList.Count; j++)
                {
                    for (int i = 0; i < elemList[j].ChildNodes.Count; i++)
                    {
                        if (elemList[j].ChildNodes[i].Name == "FilePath") { NotAllowedFile.Add(elemList[j].ChildNodes[i].InnerText.Trim()); }
                    }
                }
            }


            DirectoryInfo DInfo = new DirectoryInfo(SourceDir);
            if (AllowOverrideDir(NotAllowedDir, SourceDir))
            {
                FileInfo[] FInfos = DInfo.GetFiles();
                if (FInfos.Length > 0)
                {
                    FC.Source = new List<string>();
                    FC.Target = new List<string>();
                    foreach (FileInfo FInfo in FInfos)
                    {
                        if (FInfo.Name.ToLower() != excludeFile && AllowOverrideFile(NotAllowedFile, FInfo.FullName))   //排除更新用的定義檔和客製化檔案
                        {
                            FC.Source.Add(FInfo.FullName);
                            FC.Target.Add(TargetDir + FInfo.Name);
                        }
                        if (FC.Source.Count > 0)
                        {
                            if (!FtpUpload(FC))
                            {
                                success = false;
                                _log += "<div>" + TargetDir + FInfo.Name + "更新失敗：" + log + "</div>";
                            }
                        }
                    }
                }

                DirectoryInfo[] DInfos = DInfo.GetDirectories();
                if (DInfos.Length > 0)
                {
                    FC.Source = new List<string>();
                    FC.Target = new List<string>();
                    foreach (DirectoryInfo cDInfo in DInfos)
                    {
                        if (AllowOverrideDir(NotAllowedDir, cDInfo.FullName))
                        {
                            FC.Target.Add(TargetDir + cDInfo.Name);
                        }
                    }
                    if (FC.Target.Count > 0)
                    {
                        FtpCreateDir(FC);

                        //檢查資料夾底下是否還有檔案和資料夾
                        foreach (DirectoryInfo cDInfo in DInfos)
                        {
                            if (!FtpCopySoruce(FC, SourceDir + "/" + cDInfo.Name, TargetDir + cDInfo.Name + "/", excludeFile))
                            {
                                _log += log;
                            }
                        }
                    }
                }
            }

            log = _log;

            return success;
        }

        public bool AllowOverrideDir(List<string> List, string Target)
        {
            bool Override = true;
            DirectoryInfo TInfo = new DirectoryInfo((Target.IndexOf("~/") > -1 ? Server.MapPath(Target) : Target));
            foreach (string item in List)
            {
                DirectoryInfo LInfo = new DirectoryInfo((item.IndexOf("~/") > -1 ? Server.MapPath(item) : item));
                if (TInfo.FullName == LInfo.FullName)
                {
                    Override = false; break;
                }
            }
            return Override;
        }

        public bool AllowOverrideFile(List<string> List, string Target)
        {
            bool Override = true;
            FileInfo TInfo = new FileInfo((Target.IndexOf("~/") > -1 ? Server.MapPath(Target) : Target));
            foreach (string item in List)
            {
                FileInfo LInfo = new FileInfo((item.IndexOf("~/") > -1 ? Server.MapPath(item) : item));
                if (TInfo.FullName == LInfo.FullName)
                {
                    Override = false; break;
                }
            }
            return Override;
        }

        public bool FtpDelFile(FtpCredential FC)
        {
            return FtpDel(FC, false);
        }

        public bool FtpDelDir(FtpCredential FC)
        {
            return FtpDel(FC, true);
        }

        protected bool FtpDel(FtpCredential FC, bool TypeIsDir = false)
        {
            bool success = true;
            log = "";

            foreach (string Target in FC.Target)
            {
                try
                {
                    FtpWebRequest request = (FtpWebRequest)WebRequest.Create(Target);
                    if (TypeIsDir)
                    {
                        request.Method = WebRequestMethods.Ftp.RemoveDirectory;
                    }
                    else
                    {
                        request.Method = WebRequestMethods.Ftp.DeleteFile;
                    }
                    request.Credentials = new NetworkCredential(FC.Username, FC.Password);
                    FtpWebResponse response = (FtpWebResponse)request.GetResponse();
                    response.Close();

                }
                catch (Exception ex)
                {
                    success = false;
                    log += "<div>" + ex.Message + "</div>";
                }
            }

            return success;
        }

        public bool FtpCreateDir(FtpCredential FC)
        {
            bool success = true;
            log = "";

            foreach (string Target in FC.Target)
            {
                try
                {
                    FtpWebRequest request = (FtpWebRequest)WebRequest.Create(Target);
                    request.Method = WebRequestMethods.Ftp.MakeDirectory;
                    request.Credentials = new NetworkCredential(FC.Username, FC.Password);
                    FtpWebResponse response = (FtpWebResponse)request.GetResponse();
                    response.Close();
                }
                catch (Exception ex)
                {
                    success = false;
                    log += "<div>" + Target + "：資料夾已存在或" + ex.Message + "</div>";
                }
            }

            return success;
        }



        #endregion

        #region 解壓縮

        public bool UnZipFiles(string path, string password = null)
        {
            bool success = true;
            log = "";

            ZipInputStream zis = null;
            if (path.IndexOf("~/") > -1) { path = Server.MapPath(path); }

            try
            {
                string unZipPath = path.ToLower().Replace(".zip", "");
                if (!Directory.Exists(unZipPath))
                {
                    Directory.CreateDirectory(unZipPath);
                }
                zis = new ZipInputStream(File.OpenRead(path));
                if (password != null && password != string.Empty) zis.Password = password;
                ZipEntry entry;

                while ((entry = zis.GetNextEntry()) != null)
                {
                    string filePath = unZipPath + @"\" + entry.Name;
                    if (entry.Name != "")
                    {
                        if (entry.IsDirectory)
                        {
                            if (!Directory.Exists(filePath))
                            {
                                Directory.CreateDirectory(filePath);
                            }
                        }
                        else
                        {
                            FileStream fs = File.Create(filePath);
                            int size = 2048;
                            byte[] buffer = new byte[2048];
                            while (true)
                            {
                                size = zis.Read(buffer, 0, buffer.Length);
                                if (size > 0) { fs.Write(buffer, 0, size); }
                                else { break; }
                            }

                            fs.Close();
                            fs.Dispose();
                        }
                    }
                }
            }

            catch (Exception ex)
            {
                success = false;
                log = ex.Message;
            }

            finally
            {
                if (zis != null)
                {
                    zis.Close();
                    zis.Dispose();
                }
            }

            return success;

        }


        #endregion

        #region 容量限制


        public bool CheckCountLimit()
        {
            bool isOk = false;

            if (!isStrNull(HttpContext.Current.Application[SC + "_CheckCountLimit"]))
            {
                try
                {
                    isOk = (HttpContext.Current.Application[SC + "_CheckCountLimit"].ToString() == "Y" ? true : false);
                }
                catch (Exception)
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "_CheckCountLimit"] = null;
                    HttpContext.Current.Application.UnLock();
                }
            }

            if (isStrNull(HttpContext.Current.Application[SC + "_CheckCountLimit"]))
            {
                ez.data.configExtend c = new ez.data.configExtend("global");
                string parameters = "file_size_limit";
                DataTable dt = c.GetSetView(parameters.Split(','));
                if (dt.Rows.Count > 0)
                {
                    if (!isStrNull(dt.Rows[0]["file_size_limit"]))
                    {
                        long limit = Val(dt.Rows[0]["file_size_limit"]);
                        long nowCount = SpaceUsage();
                        if (nowCount < limit) { isOk = true; }
                    }
                    else
                    {
                        isOk = true;
                    }
                }
                else
                {
                    isOk = true;
                }
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + "_CheckCountLimit"] = (isOk ? "Y" : "N");
                HttpContext.Current.Application.UnLock();
            }

            return isOk;
        }

        public long SpaceUsage(string Unit = "MB")
        {
            long Usage = GetTargetByte();

            switch (Unit)
            {
                case "MB":
                    Usage = Val(Math.Round(Convert.ToDecimal(Usage / 1024 / 1024), 0, MidpointRounding.AwayFromZero));
                    break;
                case "KB":
                    Usage = Val(Math.Round(Convert.ToDecimal(Usage / 1024), 0, MidpointRounding.AwayFromZero));
                    break;
                default:
                    break;
            }

            return Usage;
        }

        public long GetTargetByte(string Dir = "~/upload")
        {
            long UseByte = 0;

            string Path = Server.MapPath(Dir);
            DirectoryInfo DirInfo = new DirectoryInfo(Path);
            DirectoryInfo[] SubDirs = DirInfo.GetDirectories();
            FileInfo[] SubFiles = DirInfo.GetFiles();
            if (SubFiles.Length > 0)
            {
                foreach (FileInfo item in SubFiles)
                {
                    try
                    {
                        UseByte += item.Length;
                    }
                    catch (Exception)
                    {
                    }
                }
            }
            if (SubDirs.Length > 0)
            {
                foreach (DirectoryInfo item in SubDirs) { UseByte += GetTargetByte(Dir + "/" + item.Name); }
            }
            return UseByte;
        }


        #endregion

    }
}
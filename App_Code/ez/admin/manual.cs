///1.15.0402@操作手冊模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;

/// <summary>
/// manual 的摘要描述
/// </summary>
public class manual : ez.function
{
	public manual()
	{
		//
		// TODO: 在這裡新增建構函式邏輯
		//
	}

    public string GetContent(string part_no, int chapter)
    {
        string Content = "";

        ez.admin.configuration configuration = new ez.admin.configuration();
        configuration.Load();
 
        try
        {
            Content = ReadPostFormContent(configuration.Data.WrpManual, "part_no=" + part_no + "&chapter=" + chapter.ToString());
        }
        catch (Exception ex)
        {
            Content = ex.Message;
        }

        return Content;
    }


}